import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';

const router = Router();

// Get unread counts for all chats
router.get(
  '/unread-counts',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const unreadCounts = await notificationService.getUnreadCounts(userId);

      res.json({
        success: true,
        data: unreadCounts,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get total unread count
router.get(
  '/total-unread',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const totalUnread = await notificationService.getTotalUnreadCount(userId);

      res.json({
        success: true,
        data: { totalUnread },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user notifications
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await notificationService.getUserNotifications(userId, limit);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark chat notifications as read
router.post(
  '/mark-read/:chatId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { chatId } = req.params;

      await notificationService.markChatNotificationsRead(userId, chatId);

      res.json({
        success: true,
        message: 'Notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
