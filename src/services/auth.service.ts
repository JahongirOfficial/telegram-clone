import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models/User.model';
import { 
  AuthToken, 
  JWTPayload,
  OnlineStatus
} from '../models/types';
import { 
  ValidationError, 
  ExpiredError, 
  NotFoundError,
  AuthenticationError 
} from '../utils/errors';

export class AuthService {
  private readonly SESSION_DAYS = 30;

  // Simple login with phone number (no SMS verification)
  async loginWithPhone(phoneNumber: string): Promise<AuthToken> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new ValidationError('Invalid phone number format');
    }

    // Find or create user
    const user = await this.findOrCreateUser(phoneNumber);

    // Generate tokens
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;
      
      // Get user from MongoDB
      const user = await User.findById(payload.userId);

      if (!user) {
        throw new NotFoundError('User');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ExpiredError('Refresh token');
      }
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      onlineStatus: 'offline',
      lastSeen: new Date(),
    });
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ExpiredError('Access token');
      }
      throw new AuthenticationError('Invalid access token');
    }
  }

  async findOrCreateUser(phoneNumber: string): Promise<IUser> {
    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    
    if (user) {
      // Update online status
      user.onlineStatus = 'online';
      await user.save();
      return user;
    }

    // Create new user
    const defaultName = `User ${phoneNumber.slice(-4)}`;
    
    user = new User({
      phoneNumber,
      name: defaultName,
      onlineStatus: 'online',
      lastSeen: new Date(),
    });

    await user.save();
    return user;
  }

  async getUser(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  private generateTokens(user: IUser): AuthToken {
    const payload: JWTPayload = {
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '1h',
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      userId: user._id.toString(),
      expiresIn: this.SESSION_DAYS * 24 * 60 * 60,
    };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export const authService = new AuthService();
