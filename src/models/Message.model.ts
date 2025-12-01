import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  replyTo?: mongoose.Types.ObjectId;
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4096,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'voice', 'video'],
      default: 'text',
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for fetching messages in a chat
messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
