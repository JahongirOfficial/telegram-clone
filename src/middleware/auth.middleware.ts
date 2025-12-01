import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticationError } from '../utils/errors';
import { JWTPayload } from '../models/types';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = await authService.validateToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await authService.validateToken(token);
      req.user = payload;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
