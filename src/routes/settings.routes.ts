import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { settingsService } from '../services/settings.service';

const router = Router();

// GET /settings - Get user settings
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const settings = await settingsService.getSettings(userId);

      res.json({
        success: true,
        data: {
          privacy: settings.privacy,
          notifications: settings.notifications,
          theme: settings.theme,
          language: settings.language,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /settings - Update user settings
router.put(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { privacy, notifications, theme, language } = req.body;

      const settings = await settingsService.updateSettings(userId, {
        privacy,
        notifications,
        theme,
        language,
      });

      res.json({
        success: true,
        data: {
          privacy: settings.privacy,
          notifications: settings.notifications,
          theme: settings.theme,
          language: settings.language,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
