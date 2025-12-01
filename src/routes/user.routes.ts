import { Router, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validate, updateProfileSchema } from '../middleware/validation.middleware';

const router = Router();

// GET /users/me - Get current user profile
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getUser(req.user!.userId);
      
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /users/me/update - Update current user profile
router.put(
  '/me/update',
  authenticate,
  validate(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /users/me/photo - Update profile photo
router.put(
  '/me/photo',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { profilePicture } = req.body;
      const user = await userService.updateProfile(req.user!.userId, { profilePicture });
      
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /users/profile - Create/complete user profile (for new users)
router.post(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.createProfile(req.user!.userId, req.body);
      
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /users/search - Search users by name, username, or phone
router.get(
  '/search',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query.query as string || '';
      const users = await userService.searchUsers(query, req.user!.userId);
      
      // Return limited info for search results
      const results = users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        onlineStatus: user.onlineStatus,
        lastSeen: user.lastSeen,
      }));
      
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /users/:id - Get user by ID
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getUser(req.params.id);
      
      // Return limited info for other users
      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          profilePicture: user.profilePicture,
          bio: user.bio,
          onlineStatus: user.onlineStatus,
          lastSeen: user.lastSeen,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
