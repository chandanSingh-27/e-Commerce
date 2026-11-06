const Product = require('../models/Product');
const AppError = require('../utils/AppError');

/**
 * Get catalog of active products with search, category filtering, sorting, and pagination.
 */
const getProducts = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 12);
    const skip = (page - 1) * limit;

    // Base filter: only non-deleted products
    const filter = { isDeleted: false };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // Sorting strategy
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: {
        products,
        currentPage: page,
        totalPages,
        totalProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single product by ID (excluding soft-deleted).
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product (Admin only).
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, image, category, stock, rating } =
      req.body;

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      stock,
      rating,
      isDeleted: false,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Partially update a product (Admin only, PATCH).
 * Disallows setting isDeleted via this route.
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Disallow modifying soft-delete flag through this endpoint
    const updates = { ...req.body };
    delete updates.isDeleted;

    Object.assign(product, updates);
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete product by setting isDeleted: true (Admin only).
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    product.isDeleted = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product removed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore soft-deleted product by setting isDeleted: false (Admin only).
 */
const restoreProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: true,
    });

    if (!product) {
      return next(
        new AppError('Product is not deleted or does not exist', 400)
      );
    }

    product.isDeleted = false;
    const restoredProduct = await product.save();

    res.status(200).json({
      success: true,
      data: restoredProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
};
