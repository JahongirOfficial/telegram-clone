import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  photo?: string;
  participants: {
    userId: mongoose.Types.ObjectId;
    role: 'member' | 'admin' | 'creator';
    joinedAt: Date;
  }[];
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    sentAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    name: {
      type: String,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    photo: {
      type: String,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'admin', 'creator'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastMessage: {
      content: String,
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding user's chats
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
