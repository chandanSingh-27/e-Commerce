const AppError = require('../utils/AppError');

/**
 * Global error handling middleware for Express.
 * Catches Mongoose, JWT, AppError, and unexpected exceptions,
 * sanitizes output and respects development vs production environments.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new AppError(message || 'Validation failed', 400);
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const message = `Duplicate value for field: ${field}. Please use another value.`;
    error = new AppError(message, 409);
  }

  // Handle JWT invalid signature / malformed token
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  const response = {
    success: false,
    message,
  };

  // Include stack trace only in development, never exposing DB connection strings or secrets
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
