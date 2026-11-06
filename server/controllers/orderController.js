const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

/**
 * Valid state transitions for order fulfillment lifecycle.
 * Prevents illegal jumps (e.g. Shipped -> Pending, or changing Cancelled orders).
 */
const ALLOWED_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

/**
 * Place a new order from current user's cart.
 *
 * CRITICAL TRANSACTION LOGIC:
 * 1. Requires a mandatory MongoDB transaction. If session/transaction cannot start,
 *    fails immediately with 503 without touching any database state.
 * 2. Iterates over cart items sequentially — NO Promise.all() inside transactions
 *    to prevent deadlocks and connection starvation.
 * 3. Atomic stock decrement using findOneAndUpdate with condition { stock: { $gte: qty } }.
 * 4. Stores price snapshots so future product price updates do not retroactively alter orders.
 * 5. Cleans up user cart and commits transaction.
 */
const placeOrder = async (req, res, next) => {
  let session;

  try {
    // 1. Verify user cart before initiating transaction
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items || cart.items.length === 0) {
      return next(
        new AppError('Your cart is empty. Add items before checking out.', 400)
      );
    }

    // 2. Initialize session and mandatory transaction
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (txInitError) {
      if (session) {
        session.endSession();
      }
      return res.status(503).json({
        success: false,
        message: 'Checkout is temporarily unavailable. Please try again.',
      });
    }

    // 3. Sequential item verification and stock check
    const itemsSnapshot = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findOne({
        _id: item.product,
        isDeleted: false,
      }).session(session);

      if (!product) {
        throw new AppError(
          `Product is no longer available.`,
          422
        );
      }

      if (item.quantity > product.stock) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`,
          422
        );
      }

      subtotal += product.price * item.quantity;

      itemsSnapshot.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const total = subtotal;

    // 4. Sequential atomic stock deduction
    for (const item of cart.items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.product,
          stock: { $gte: item.quantity },
          isDeleted: false,
        },
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (!result) {
        throw new AppError(
          'One or more items are no longer available in the requested quantity.',
          409
        );
      }
    }

    // 5. Generate unique human-readable order ID
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `ORD-${Date.now()}-${randomSuffix}`;

    // 6. Create order with price snapshot
    const order = new Order({
      user: req.user._id,
      orderId,
      items: itemsSnapshot,
      shippingAddress: req.body.shippingAddress,
      subtotal,
      total,
      status: 'Pending',
    });

    await order.save({ session });

    // 7. Remove cart within transaction
    await Cart.findOneAndDelete({ user: req.user._id }, { session });

    // 8. Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Retrieve orders belonging to the logged-in user with pagination.
 */
const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages,
        totalOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a single order by ID.
 * Access allowed only to the order owner or an admin.
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const isOwner = order.user.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(
        new AppError('You do not have permission to view this order', 403)
      );
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all orders across all users (Admin only) with optional status filtering.
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages,
        totalOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status with transition validation (Admin only).
 *
 * CANCELLATION GUARD & INVENTORY RESTORATION:
 * When moving to 'Cancelled', uses a conditional findOneAndUpdate query
 * filtering by { status: { $in: ['Pending', 'Confirmed'] } } inside a transaction.
 * This guarantees two concurrent cancellation requests cannot double-restore stock.
 */
const updateOrderStatus = async (req, res, next) => {
  const { status: newStatus } = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return next(
        new AppError(
          `Cannot transition order from '${order.status}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`,
          422
        )
      );
    }

    // Special handling for cancellation: requires transaction + stock rollback
    if (newStatus === 'Cancelled') {
      let session;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (txErr) {
        if (session) session.endSession();
        return res.status(503).json({
          success: false,
          message: 'Unable to process cancellation at this time.',
        });
      }

      try {
        // Atomic status transition check to prevent race condition double-cancellation
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: orderId, status: { $in: ['Pending', 'Confirmed'] } },
          { $set: { status: 'Cancelled' } },
          { session, new: true }
        );

        if (!updatedOrder) {
          await session.abortTransaction();
          return next(
            new AppError('Order cannot be cancelled in its current state.', 422)
          );
        }

        // Increment stock back sequentially — NO Promise.all() inside transaction
        for (const item of updatedOrder.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }

        await session.commitTransaction();

        return res.status(200).json({
          success: true,
          data: updatedOrder,
        });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    // Non-cancellation transition (e.g. Confirmed -> Shipped -> Delivered)
    order.status = newStatus;
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
};
