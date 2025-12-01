import mongoose from 'mongoose';
import { Settings, ISettings } from '../models/Settings.model';

export interface UpdateSettingsInput {
  privacy?: {
    lastSeen?: 'everyone' | 'contacts' | 'nobody';
    profilePhoto?: 'everyone' | 'contacts' | 'nobody';
    onlineStatus?: 'everyone' | 'contacts' | 'nobody';
    readReceipts?: boolean;
  };
  notifications?: {
    messages?: boolean;
    groups?: boolean;
    sounds?: boolean;
    vibration?: boolean;
    preview?: boolean;
  };
  theme?: 'light' | 'dark' | 'system';
  language?: string;
}

export class SettingsService {
  async getSettings(userId: string): Promise<ISettings> {
    let settings = await Settings.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    // Create default settings if not exists
    if (!settings) {
      settings = await Settings.create({
        userId: new mongoose.Types.ObjectId(userId),
      });
    }

    return settings;
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<ISettings> {
    const updateData: any = {};

    if (input.privacy) {
      if (input.privacy.lastSeen !== undefined) {
        updateData['privacy.lastSeen'] = input.privacy.lastSeen;
      }
      if (input.privacy.profilePhoto !== undefined) {
        updateData['privacy.profilePhoto'] = input.privacy.profilePhoto;
      }
      if (input.privacy.onlineStatus !== undefined) {
        updateData['privacy.onlineStatus'] = input.privacy.onlineStatus;
      }
      if (input.privacy.readReceipts !== undefined) {
        updateData['privacy.readReceipts'] = input.privacy.readReceipts;
      }
    }

    if (input.notifications) {
      if (input.notifications.messages !== undefined) {
        updateData['notifications.messages'] = input.notifications.messages;
      }
      if (input.notifications.groups !== undefined) {
        updateData['notifications.groups'] = input.notifications.groups;
      }
      if (input.notifications.sounds !== undefined) {
        updateData['notifications.sounds'] = input.notifications.sounds;
      }
      if (input.notifications.vibration !== undefined) {
        updateData['notifications.vibration'] = input.notifications.vibration;
      }
      if (input.notifications.preview !== undefined) {
        updateData['notifications.preview'] = input.notifications.preview;
      }
    }

    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }

    if (input.language !== undefined) {
      updateData.language = input.language;
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return settings!;
  }
}

export const settingsService = new SettingsService();
