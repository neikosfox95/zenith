// ============================================================
// STANDARDIZED ERROR HANDLING MIDDLEWARE
// ------------------------------------------------------------
// Changes from the previous version:
//   * ServiceUnavailableError (503) is handled explicitly and *before* the
//     Mongo branch, so "DB is down" no longer gets flattened into a generic
//     500 "Database error".
//   * Multer / body-parser / Zod errors are mapped to 4xx instead of 500.
//   * The "hide the message in production" rule no longer applies to 4xx
//     client errors — telling a client "An error occurred" when they sent a
//     bad payload is what made the API feel broken.
//   * Stack traces are never serialised to the client.
//   * Error logging is one line for expected errors, full stack for 5xx.
// ============================================================

import multer from 'multer';
import config from '../config/index.js';

// Custom error class
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
    this.details = details;
  }
}

// Error response formatter
export const formatErrorResponse = (error, req) => {
  const body = {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: req?.originalUrl || req?.path,
      method: req?.method,
    },
  };
  if (error.details) body.error.details = error.details;
  // Never leak a stack trace to clients.
  if (!config.isProduction && error.statusCode >= 500 && error.stack) {
    body.error.stack = error.stack.split('\n').slice(0, 6).join('\n');
  }
  return body;
};

const send = (res, req, statusCode, message, code, details) =>
  res
    .status(statusCode)
    .json(formatErrorResponse(new APIError(message, statusCode, code, details), req));

/** Map a thrown value onto an HTTP status without losing the original intent. */
function classify(err) {
  // ------------------------------------------------------------
  // Well-known middleware errors are matched FIRST, by `type`/`name`.
  //
  // This ordering matters: body-parser's SyntaxError already carries
  // `statusCode = 400`, so a generic "has a statusCode" shortcut ahead of it
  // would classify a malformed-JSON request as code 'ERROR' and throw away the
  // only detail that tells the client what they did wrong.
  // ------------------------------------------------------------

  // express.json() / urlencoded failures — previously surfaced as a 500.
  if (err.type === 'entity.parse.failed') {
    return {
      status: 400,
      code: 'MALFORMED_JSON',
      message: `Request body is not valid JSON (${err.message})`,
    };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the size limit' };
  }
  if (err.type === 'request.aborted') {
    return { status: 400, code: 'REQUEST_ABORTED', message: 'Request was aborted' };
  }
  if (err.type === 'charset.unsupported') {
    return { status: 415, code: 'UNSUPPORTED_CHARSET', message: 'Unsupported charset' };
  }
  if (err.type === 'encoding.unsupported') {
    return { status: 415, code: 'UNSUPPORTED_ENCODING', message: 'Unsupported content encoding' };
  }

  // Already an HTTP-aware error (APIError, ServiceUnavailableError, ...)
  if (err.statusCode) {
    return {
      status: err.statusCode,
      code: err.code || 'ERROR',
      message: err.message,
      details: err.details,
    };
  }

  if (err.name === 'ValidationError') {
    return { status: 400, code: 'VALIDATION_ERROR', message: err.message };
  }
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return { status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized access' };
  }
  if (err.name === 'TokenExpiredError') {
    return { status: 401, code: 'TOKEN_EXPIRED', message: 'Token expired' };
  }
  if (err.name === 'NotBeforeError') {
    return { status: 401, code: 'TOKEN_NOT_ACTIVE', message: 'Token not active' };
  }

  // Multer (file upload) failures — previously surfaced as a 500.
  if (typeof multer !== 'undefined' && err instanceof multer.MulterError) {
    const map = {
      LIMIT_FILE_SIZE: { status: 413, message: 'File exceeds the maximum allowed size' },
      LIMIT_FILE_COUNT: { status: 400, message: 'Too many files in one request' },
      LIMIT_FIELD_COUNT: { status: 400, message: 'Too many fields in one request' },
      LIMIT_FIELD_KEY: { status: 400, message: 'Field name is too long' },
      LIMIT_FIELD_VALUE: { status: 400, message: 'Field value is too long' },
      LIMIT_PART_COUNT: { status: 400, message: 'Too many parts in one request' },
      LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field in request' },
    };
    const mapped = map[err.code] || { status: 400, message: err.message };
    return { status: mapped.status, code: err.code, message: mapped.message };
  }

  // Zod
  if (err.name === 'ZodError') {
    return { status: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed', details: err.issues };
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError' || err.name === 'MongoNotConnectedError') {
    if (err.code === 11000) {
      return { status: 409, code: 'DUPLICATE_ENTRY', message: 'Duplicate entry' };
    }
    return { status: 500, code: 'DATABASE_ERROR', message: 'Database error' };
  }

  return {
    status: 500,
    code: err.code && typeof err.code === 'string' && !/^[A-Z_]+$/.test(err.code) ? 'INTERNAL_ERROR' : err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  };
}

// Main error handling middleware
export const errorHandler = (err, req, res, next) => {
  // A response that already started cannot be rewritten.
  if (res.headersSent) {
    return next(err);
  }

  const classified = classify(err);
  const isServerError = classified.status >= 500;

  if (isServerError) {
    console.error(
      `[error] ${req.method} ${req.originalUrl} -> ${classified.status} ${classified.code}: ${err.message}`
    );
    if (classified.status === 500 && classified.code === 'INTERNAL_ERROR') {
      console.error(err.stack);
    }
  } else if (config.server.requestLog) {
    console.warn(
      `[error] ${req.method} ${req.originalUrl} -> ${classified.status} ${classified.code}`
    );
  }

  // 5xx messages are generic in production; 4xx stay specific everywhere so
  // clients can actually act on them.
  const message =
    isServerError && config.isProduction && classified.code === 'INTERNAL_ERROR'
      ? 'An internal error occurred'
      : classified.message;

  send(res, req, classified.status, message, classified.code, classified.details);
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
};

// Async error wrapper — Express 4 does not catch rejected promises, so every
// async handler needs this (or an explicit try/catch).
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
  formatErrorResponse,
};
