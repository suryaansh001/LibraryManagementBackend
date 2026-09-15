import pino from 'pino';
import { AppError } from '../lib/errors.js';

const logger = pino({ level: (process.env.NODE_ENV || 'development') === 'development' ? 'debug' : 'info' });

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
    },
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Server error');
  } else {
    logger.info({ err, path: req.path, method: req.method }, 'Client error');
  }

  if (!res.headersSent) {
    res.status(statusCode).json(response);
  } else {
    next(err);
  }
}

export function notFoundHandler(req, res, next) {
  const err = new AppError(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND', 404);
  next(err);
}
