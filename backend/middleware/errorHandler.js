// Standardized Error Handling Middleware

// Custom error class
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

// Error response formatter
export const formatErrorResponse = (error, req) => {
  return {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };
};

// Main error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json(formatErrorResponse(
      new APIError(err.message, 400, 'VALIDATION_ERROR'),
      req
    ));
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json(formatErrorResponse(
      new APIError('Unauthorized access', 401, 'UNAUTHORIZED'),
      req
    ));
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json(formatErrorResponse(
        new APIError('Duplicate entry', 409, 'DUPLICATE_ENTRY'),
        req
      ));
    }
    return res.status(500).json(formatErrorResponse(
      new APIError('Database error', 500, 'DATABASE_ERROR'),
      req
    ));
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred' 
    : err.message;

  res.status(statusCode).json(formatErrorResponse(
    new APIError(message, statusCode, errorCode),
    req
  ));
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString()
    }
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  formatErrorResponse
};
