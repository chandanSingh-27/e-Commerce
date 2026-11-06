const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware to check express-validator validation results.
 * If validation fails, passes an AppError (400) with formatted messages to next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.path ? err.path + ': ' : ''}${err.msg}`)
      .join(', ');
    return next(new AppError(errorMessages, 400));
  }
  next();
};

module.exports = validate;
