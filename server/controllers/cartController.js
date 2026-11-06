const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

/**
 * Helper to populate cart items with current product metadata.
 */
const populateCart = async (cart) => {
  return await cart.populate(
    'items.product',
    'name price image stock isDeleted category'
  );
};

/**
 * Retrieve the current user's shopping cart.
 * Automatically inspects items for soft-deleted products,
 * segregates them into a warnings array, and returns only active items.
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price image stock isDeleted category'
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: {
            items: [],
            warnings: [],
          },
        },
      });
    }

    const activeItems = [];
    const warnings = [];

    cart.items.forEach((item) => {
      if (!item.product || item.product.isDeleted) {
        warnings.push(
          item.product ? item.product.name : 'Unknown or removed product'
        );
      } else {
        activeItems.push(item);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        cart: {
          items: activeItems,
          warnings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an item to the user's cart or increment its quantity.
 * Enforces combined stock verification: existingQty + requestedQty <= product.stock.
 */
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const requestedQty = parseInt(quantity, 10);

    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check existing quantity for this product in user's cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );
    const existingQty = existingItem ? existingItem.quantity : 0;

    // Validate available inventory
    if (existingQty + requestedQty > product.stock) {
      const remainingAvailable = Math.max(0, product.stock - existingQty);
      return next(
        new AppError(
          `Insufficient stock. Only ${remainingAvailable} more available.`,
          422
        )
      );
    }

    if (existingItem) {
      existingItem.quantity += requestedQty;
    } else {
      cart.items.push({ product: productId, quantity: requestedQty });
    }

    await cart.save();
    await populateCart(cart);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update the exact quantity of a specific product in the cart.
 * Validates new requested quantity against available product stock.
 */
const updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const newQuantity = parseInt(req.body.quantity, 10);

    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (newQuantity > product.stock) {
      return next(
        new AppError(
          `Insufficient stock. Only ${product.stock} available.`,
          422
        )
      );
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return next(new AppError('Item not found in cart', 404));
    }

    cart.items[itemIndex].quantity = newQuantity;
    await cart.save();
    await populateCart(cart);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item completely from the user's cart.
 */
const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await populateCart(cart);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
