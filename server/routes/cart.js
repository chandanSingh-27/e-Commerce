const express = require('express');
const { body, param } = require('express-validator');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Apply protect middleware across all cart routes
router.use(protect);

// GET /api/cart - Get current user cart
router.get('/', getCart);

// POST /api/cart/items - Add item to cart
router.post(
  '/items',
  [
    body('productId').isMongoId().withMessage('Invalid product ID format'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be an integer greater than or equal to 1'),
  ],
  validate,
  addItem
);

// PATCH /api/cart/items/:productId - Update item quantity in cart
router.patch(
  '/items/:productId',
  [
    param('productId').isMongoId().withMessage('Invalid product ID format'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be an integer greater than or equal to 1'),
  ],
  validate,
  updateItem
);

// DELETE /api/cart/items/:productId - Remove item from cart
router.delete(
  '/items/:productId',
  [param('productId').isMongoId().withMessage('Invalid product ID format')],
  validate,
  removeItem
);

module.exports = router;
