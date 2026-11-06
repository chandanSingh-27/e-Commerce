const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A product must have a description'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    image: {
      type: String,
      default: 'https://placehold.co/400x300?text=No+Image',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'A product must have a category'],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'A product must specify stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be lower than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category filtering and soft-delete exclusions
productSchema.index({ category: 1, isDeleted: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
