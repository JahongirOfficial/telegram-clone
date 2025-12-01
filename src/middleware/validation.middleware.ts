import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};

// Validation schemas for auth routes
export const sendCodeSchema = z.object({
  body: z.object({
    phoneNumber: z.string()
      .regex(/^\+[1-9]\d{9,14}$/, 'Invalid phone number format. Must start with + and have 10-15 digits'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    username: z.string()
      .regex(/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/, 'Invalid username format')
      .optional(),
    bio: z.string().max(500).optional(),
    profilePicture: z.string().url().optional(),
  }),
});
