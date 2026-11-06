const express = require('express');
const { body, param } = require('express-validator');
const {
  placeOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Apply protect middleware across all order routes
router.use(protect);

// POST /api/orders - Place a new order with MongoDB transaction
router.post(
  '/',
  [
    body('shippingAddress.name')
      .trim()
      .notEmpty()
      .withMessage('Recipient name is required'),
    body('shippingAddress.phone')
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone number must be a valid 10-digit number'),
    body('shippingAddress.addressLine')
      .trim()
      .notEmpty()
      .withMessage('Address line is required'),
    body('shippingAddress.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    body('shippingAddress.state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    body('shippingAddress.pincode')
      .matches(/^[0-9]{6}$/)
      .withMessage('Pincode must be a valid 6-digit code'),
  ],
  validate,
  placeOrder
);

// GET /api/orders/my-orders - Current user's orders (defined before /:id)
router.get('/my-orders', getMyOrders);

// GET /api/orders - Admin listing of all orders with optional status filter
router.get('/', authorize('admin'), getAllOrders);

// GET /api/orders/:id - Single order details (owner or admin)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid order ID format')],
  validate,
  getOrder
);

// PATCH /api/orders/:id/status - Admin update order status with cancellation transaction guard
router.patch(
  '/:id/status',
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid order ID format'),
    body('status')
      .isIn(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'])
      .withMessage(
        'Status must be one of: Pending, Confirmed, Shipped, Delivered, Cancelled'
      ),
  ],
  validate,
  updateOrderStatus
);

module.exports = router;
