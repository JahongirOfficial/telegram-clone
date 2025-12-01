import { User, IUser } from '../models/User.model';
import { UserProfile, OnlineStatus } from '../models/types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

export class UserService {
  async createProfile(userId: string, profile: UserProfile): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate username if provided
    if (profile.username) {
      await this.validateUsername(profile.username, userId);
    }

    // Update user
    user.name = profile.name;
    if (profile.username) user.username = profile.username;
    if (profile.profilePicture) user.profilePicture = profile.profilePicture;
    if (profile.bio) user.bio = profile.bio;

    await user.save();
    return user;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate username if being updated
    if (updates.username) {
      await this.validateUsername(updates.username, userId);
    }

    // Update fields
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.username !== undefined) user.username = updates.username;
    if (updates.profilePicture !== undefined) user.profilePicture = updates.profilePicture;
    if (updates.bio !== undefined) user.bio = updates.bio;

    await user.save();
    return user;
  }

  async getUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username: username.toLowerCase() });
  }

  // Search users by name, username, or phone number
  async searchUsers(query: string, currentUserId: string): Promise<IUser[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();
    
    // Search using MongoDB text search and regex
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm } },
      ],
    })
      .sort({ name: 1 })
      .limit(20);

    return users;
  }

  async updateOnlineStatus(userId: string, status: OnlineStatus): Promise<void> {
    const updateData: any = { onlineStatus: status };
    if (status === OnlineStatus.OFFLINE) {
      updateData.lastSeen = new Date();
    }
    await User.findByIdAndUpdate(userId, updateData);
  }

  private async validateUsername(username: string, excludeUserId?: string): Promise<void> {
    // Username format validation
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
    if (!usernameRegex.test(username)) {
      throw new ValidationError(
        'Username must start with a letter, be 5-32 characters, and contain only letters, numbers, and underscores'
      );
    }

    // Check uniqueness
    const query: any = { username: username.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    const existing = await User.findOne(query);
    if (existing) {
      throw new ConflictError('Username already taken');
    }
  }
}

export const userService = new UserService();
