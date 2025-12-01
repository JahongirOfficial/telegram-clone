import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        timestamp: new Date(),
      },
    };

    // Add extra details for verification errors
    if ((err as any).attemptsRemaining !== undefined) {
      response.error.details = {
        attemptsRemaining: (err as any).attemptsRemaining,
      };
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      timestamp: new Date(),
    },
  };

  if (config.nodeEnv !== 'production') {
    response.error.details = {
      stack: err.stack,
    };
  }

  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date(),
    },
  });
};
