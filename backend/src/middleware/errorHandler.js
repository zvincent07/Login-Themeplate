const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with context
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous',
    statusCode,
  });

  // In development, provide more details
  const response = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.path = req.path;
    response.method = req.method;
  }

  // Don't leak error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response.error = 'Internal Server Error';
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

