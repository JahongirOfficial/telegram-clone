import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  type: 'message' | 'mention' | 'group_invite' | 'group_update';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    type: {
      type: String,
      enum: ['message', 'mention', 'group_invite', 'group_update'],
      default: 'message',
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fetching user notifications
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, chatId: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
