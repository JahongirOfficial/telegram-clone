import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { messageService } from '../services/message.service';
import { uploadImage, uploadVideo, uploadFile, getImageUrl, getVideoUrl, getFileUrl } from '../middleware/upload.middleware';

const router = Router();

// GET /messages/:chatId - Get messages for a chat
router.get(
  '/:chatId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const { limit, before } = req.query;
      const userId = req.user!.userId;

      const messages = await messageService.getMessages({
        chatId,
        userId,
        limit: limit ? parseInt(limit as string) : 50,
        before: before as string,
      });

      res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHAT_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

// POST /messages/send - Send a message
router.post(
  '/send',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { chatId, content, type, replyTo } = req.body;
      const senderId = req.user!.userId;

      if (!chatId || !content) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'chatId and content are required' },
        });
      }

      if (content.length > 4096) {
        return res.status(400).json({
          success: false,
          error: { code: 'MESSAGE_TOO_LONG', message: 'Message cannot exceed 4096 characters' },
        });
      }

      const message = await messageService.sendMessage({
        chatId,
        senderId,
        content,
        type,
        replyTo,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHAT_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

// POST /messages/:chatId/read - Mark messages as read
router.post(
  '/:chatId/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user!.userId;

      const result = await messageService.markAsRead(chatId, userId, messageIds);

      res.json({
        success: true,
        message: 'Messages marked as read',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /messages/:messageId/status - Get message read status
router.get(
  '/:messageId/status',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;

      const status = await messageService.getMessageReadStatus(messageId, userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'MESSAGE_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

// POST /messages/send-image - Send an image message
router.post(
  '/send-image',
  authenticate,
  uploadImage.single('image'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { chatId, replyTo } = req.body;
      const senderId = req.user!.userId;
      const file = req.file;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'chatId is required' },
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Image file is required' },
        });
      }

      const imageUrl = getImageUrl(file.filename);

      const message = await messageService.sendMessage({
        chatId,
        senderId,
        content: imageUrl,
        type: 'image',
        replyTo,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHAT_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

// POST /messages/send-video - Send a video message
router.post(
  '/send-video',
  authenticate,
  uploadVideo.single('video'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { chatId, replyTo } = req.body;
      const senderId = req.user!.userId;
      const file = req.file;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'chatId is required' },
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Video file is required' },
        });
      }

      const videoUrl = getVideoUrl(file.filename);

      const message = await messageService.sendMessage({
        chatId,
        senderId,
        content: videoUrl,
        type: 'video',
        replyTo,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHAT_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

// POST /messages/send-file - Send a file message
router.post(
  '/send-file',
  authenticate,
  uploadFile.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { chatId, replyTo } = req.body;
      const senderId = req.user!.userId;
      const file = req.file;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'chatId is required' },
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'File is required' },
        });
      }

      const fileUrl = getFileUrl(file.filename);

      // Store file metadata in content as JSON
      const fileData = JSON.stringify({
        url: fileUrl,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      const message = await messageService.sendMessage({
        chatId,
        senderId,
        content: fileData,
        type: 'file',
        replyTo,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHAT_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

export default router;
