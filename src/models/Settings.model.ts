import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    onlineStatus: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  notifications: {
    messages: boolean;
    groups: boolean;
    sounds: boolean;
    vibration: boolean;
    preview: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    privacy: {
      lastSeen: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      profilePhoto: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      onlineStatus: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
    },
    notifications: {
      messages: {
        type: Boolean,
        default: true,
      },
      groups: {
        type: Boolean,
        default: true,
      },
      sounds: {
        type: Boolean,
        default: true,
      },
      vibration: {
        type: Boolean,
        default: true,
      },
      preview: {
        type: Boolean,
        default: true,
      },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark',
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
