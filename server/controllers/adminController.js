const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Get dashboard overview statistics (Admin only).
 * Aggregates non-deleted product count, total orders count, customer user count,
 * and total sales revenue from Confirmed, Shipped, or Delivered orders.
 */
const getStats = async (req, res, next) => {
  try {
    const [totalProducts, totalOrders, totalUsers, salesData] =
      await Promise.all([
        Product.countDocuments({ isDeleted: false }),
        Order.countDocuments(),
        User.countDocuments({ role: 'user' }),
        Order.aggregate([
          {
            $match: {
              status: { $in: ['Confirmed', 'Shipped', 'Delivered'] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
            },
          },
        ]),
      ]);

    const totalSales = salesData[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalSales,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated list of customers (role='user').
 * Never returns password hashes.
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = { role: 'user' };

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        currentPage: page,
        totalPages,
        totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
};
