import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification.model';
import { Message } from '../models/Message.model';
import { Chat } from '../models/Chat.model';
import { getSocketService } from '../socket/socket.service';

export interface CreateNotificationInput {
  userId: string;
  chatId: string;
  type: 'message' | 'mention' | 'group_invite' | 'group_update';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  // Create a notification
  async createNotification(input: CreateNotificationInput): Promise<INotification> {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(input.userId),
      chatId: new mongoose.Types.ObjectId(input.chatId),
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    });

    // Emit real-time notification
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitToUser(input.userId, 'notification:new', {
        id: notification._id.toString(),
        chatId: input.chatId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
        createdAt: notification.createdAt.toISOString(),
      });
    }

    return notification;
  }

  // Get unread count for a specific chat
  async getUnreadCountForChat(userId: string, chatId: string): Promise<number> {
    const count = await Message.countDocuments({
      chatId: new mongoose.Types.ObjectId(chatId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) },
    });
    return count;
  }

  // Get unread counts for all user's chats
  async getUnreadCounts(userId: string): Promise<{ chatId: string; unreadCount: number }[]> {
    const chats = await Chat.find({
      'participants.userId': new mongoose.Types.ObjectId(userId),
    }).select('_id');

    const unreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.getUnreadCountForChat(userId, chat._id.toString());
        return {
          chatId: chat._id.toString(),
          unreadCount,
        };
      })
    );

    return unreadCounts.filter((c) => c.unreadCount > 0);
  }

  // Get total unread count across all chats
  async getTotalUnreadCount(userId: string): Promise<number> {
    const chats = await Chat.find({
      'participants.userId': new mongoose.Types.ObjectId(userId),
    }).select('_id');

    const chatIds = chats.map((c) => c._id);

    const count = await Message.countDocuments({
      chatId: { $in: chatIds },
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) },
    });

    return count;
  }

  // Mark notifications as read for a chat
  async markChatNotificationsRead(userId: string, chatId: string): Promise<void> {
    await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        chatId: new mongoose.Types.ObjectId(chatId),
        read: false,
      },
      { read: true }
    );
  }

  // Get user's notifications
  async getUserNotifications(userId: string, limit = 50): Promise<any[]> {
    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notifications.map((n: any) => ({
      id: n._id.toString(),
      chatId: n.chatId.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  // Emit unread count update to user
  async emitUnreadUpdate(userId: string, chatId: string): Promise<void> {
    const unreadCount = await this.getUnreadCountForChat(userId, chatId);
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitUnreadUpdate(userId, chatId, unreadCount);
    }
  }
}

export const notificationService = new NotificationService();
