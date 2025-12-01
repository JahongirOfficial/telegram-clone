import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { 
  validate, 
  sendCodeSchema, 
  refreshTokenSchema 
} from '../middleware/validation.middleware';

const router = Router();

// POST /auth/login - Login with phone number (no SMS verification)
router.post(
  '/login',
  validate(sendCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber } = req.body;
      const tokens = await authService.loginWithPhone(phoneNumber);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId: tokens.userId,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/refresh - Refresh access token
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId: tokens.userId,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/logout - Logout user
router.post(
  '/logout',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.user!.userId);
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/me - Get current user info
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          userId: req.user!.userId,
          phoneNumber: req.user!.phoneNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
