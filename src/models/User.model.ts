import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  phoneNumber: string;
  username?: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen: Date;
  publicKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 32,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    onlineStatus: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    publicKey: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ name: 'text', username: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
