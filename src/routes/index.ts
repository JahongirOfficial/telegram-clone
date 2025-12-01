import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import messageRoutes from './message.routes';
import settingsRoutes from './settings.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
