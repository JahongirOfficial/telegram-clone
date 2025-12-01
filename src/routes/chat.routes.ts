import { Router, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /chats/create - Create a new chat (direct or group)
router.post(
  '/create',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, targetUserId, participantIds, name, description, photo } = req.body;
      const userId = req.user!.userId;

      let chat;

      if (type === 'direct') {
        if (!targetUserId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'targetUserId is required for direct chat' },
          });
        }
        chat = await chatService.createDirectChat(userId, targetUserId);
      } else if (type === 'group') {
        if (!name) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'name is required for group chat' },
          });
        }
        chat = await chatService.createGroupChat(
          userId,
          participantIds || [],
          name,
          description,
          photo
        );
      } else {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'type must be "direct" or "group"' },
        });
      }

      // Get populated chat data
      const populatedChat = await chatService.getChat(chat._id.toString(), userId);

      res.status(201).json({
        success: true,
        data: populatedChat,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /chats/my - Get current user's chats
router.get(
  '/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const chats = await chatService.getUserChats(req.user!.userId);

      res.status(200).json({
        success: true,
        data: chats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /chats/:id - Get single chat by ID
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const chat = await chatService.getChat(req.params.id, req.user!.userId);

      res.status(200).json({
        success: true,
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /chats/:id - Update group info
router.put(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, photo } = req.body;
      const chat = await chatService.updateGroup(
        req.params.id,
        req.user!.userId,
        { name, description, photo }
      );

      res.status(200).json({
        success: true,
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /chats/:id/members - Add members to group
router.post(
  '/:id/members',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { memberIds } = req.body;
      if (!memberIds || !Array.isArray(memberIds)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'memberIds array is required' },
        });
      }

      const chat = await chatService.addMembers(
        req.params.id,
        req.user!.userId,
        memberIds
      );

      res.status(200).json({
        success: true,
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /chats/:id/members/:memberId - Remove member from group
router.delete(
  '/:id/members/:memberId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const chat = await chatService.removeMember(
        req.params.id,
        req.user!.userId,
        req.params.memberId
      );

      res.status(200).json({
        success: true,
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /chats/:id/leave - Leave group
router.post(
  '/:id/leave',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await chatService.leaveGroup(req.params.id, req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Left group successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
