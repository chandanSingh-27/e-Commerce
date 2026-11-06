const express = require('express');
const { body, param } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/products - Public listing with filters & pagination
router.get('/', getProducts);

// GET /api/products/:id - Public product details
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  validate,
  getProduct
);

// POST /api/products - Admin create product
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a number greater than or equal to 0'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be an integer greater than or equal to 0'),
    body('image').optional().isURL().withMessage('Image must be a valid URL'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
  ],
  validate,
  createProduct
);

// PATCH /api/products/:id - Admin partial update product
router.patch(
  '/:id',
  protect,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid product ID format'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Description cannot be empty'),
    body('category')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category cannot be empty'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a number greater than or equal to 0'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be an integer greater than or equal to 0'),
    body('image').optional().isURL().withMessage('Image must be a valid URL'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
  ],
  validate,
  updateProduct
);

// DELETE /api/products/:id - Admin soft-delete product
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  validate,
  deleteProduct
);

// PATCH /api/products/:id/restore - Admin restore soft-deleted product
router.patch(
  '/:id/restore',
  protect,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  validate,
  restoreProduct
);

module.exports = router;
