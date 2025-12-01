import mongoose from 'mongoose';
import { Message, IMessage } from '../models/Message.model';
import { Chat } from '../models/Chat.model';
import { User } from '../models/User.model';
import { getSocketService } from '../socket/socket.service';

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'voice' | 'video';
  replyTo?: string;
}

export interface GetMessagesInput {
  chatId: string;
  userId: string;
  limit?: number;
  before?: string;
}

export class MessageService {
  async sendMessage(input: SendMessageInput) {
    const { chatId, senderId, content, type = 'text', replyTo } = input;

    // Verify chat exists and user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.userId': senderId,
    });

    if (!chat) {
      throw new Error('Chat not found or you are not a participant');
    }

    // Create message
    const message = await Message.create({
      chatId: new mongoose.Types.ObjectId(chatId),
      senderId: new mongoose.Types.ObjectId(senderId),
      content,
      type,
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
      readBy: [{ userId: new mongoose.Types.ObjectId(senderId), readAt: new Date() }],
    });

    // Update chat's lastMessage
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        content: content.substring(0, 100),
        senderId: new mongoose.Types.ObjectId(senderId),
        sentAt: message.createdAt,
      },
      updatedAt: new Date(),
    });

    // Get sender info for the response
    const sender = await User.findById(senderId).select('name profilePicture');

    const messageData = {
      id: message._id.toString(),
      chatId: message.chatId.toString(),
      senderId: message.senderId.toString(),
      senderName: sender?.name,
      senderPhoto: sender?.profilePicture,
      content: message.content,
      type: message.type,
      replyTo: message.replyTo?.toString(),
      createdAt: message.createdAt.toISOString(),
    };

    // Emit to chat room via socket
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitToChat(chatId, 'message:new', messageData);

      // Emit unread count update to all participants except sender
      chat.participants.forEach((p) => {
        const participantId = p.userId.toString();
        if (participantId !== senderId) {
          // Count unread for this participant
          Message.countDocuments({
            chatId: new mongoose.Types.ObjectId(chatId),
            senderId: { $ne: p.userId },
            'readBy.userId': { $ne: p.userId },
          }).then((unreadCount) => {
            socketService.emitUnreadUpdate(participantId, chatId, unreadCount);
          });
        }
      });
    }

    return messageData;
  }

  async getMessages(input: GetMessagesInput) {
    const { chatId, userId, limit = 50, before } = input;

    // Verify user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.userId': userId,
    });

    if (!chat) {
      throw new Error('Chat not found or you are not a participant');
    }

    // Build query
    const query: any = { chatId: new mongoose.Types.ObjectId(chatId), deletedAt: null };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name profilePicture')
      .lean();

    // Format response
    return messages.map((msg: any) => ({
      id: msg._id.toString(),
      chatId: msg.chatId.toString(),
      senderId: msg.senderId._id.toString(),
      senderName: msg.senderId.name,
      senderPhoto: msg.senderId.profilePicture,
      content: msg.content,
      type: msg.type,
      replyTo: msg.replyTo?.toString(),
      readBy: msg.readBy.map((r: any) => ({
        userId: r.userId.toString(),
        readAt: r.readAt.toISOString(),
      })),
      createdAt: msg.createdAt.toISOString(),
      editedAt: msg.editedAt?.toISOString(),
    })).reverse(); // Return in chronological order
  }

  async markAsRead(chatId: string, userId: string, messageIds?: string[]) {
    const query: any = {
      chatId: new mongoose.Types.ObjectId(chatId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) },
    };

    // If specific message IDs provided, only mark those
    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const result = await Message.updateMany(query, {
      $push: {
        readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() },
      },
    });

    // If messages were updated, notify the senders
    if (result.modifiedCount > 0) {
      // Get the updated messages to notify senders
      const updatedMessages = await Message.find({
        chatId: new mongoose.Types.ObjectId(chatId),
        'readBy.userId': new mongoose.Types.ObjectId(userId),
      }).select('_id senderId');

      const socketService = getSocketService();
      if (socketService) {
        // Emit message:seen event to the chat
        socketService.emitToChat(chatId, 'message:seen', {
          chatId,
          readBy: {
            userId,
            readAt: new Date().toISOString(),
          },
          messageIds: updatedMessages.map(m => m._id.toString()),
        });

        // Emit updated unread count to the user who read the messages
        const newUnreadCount = await Message.countDocuments({
          chatId: new mongoose.Types.ObjectId(chatId),
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) },
        });
        socketService.emitUnreadUpdate(userId, chatId, newUnreadCount);
      }
    }

    return { modifiedCount: result.modifiedCount };
  }

  async getMessageReadStatus(messageId: string, userId: string) {
    const message = await Message.findById(messageId)
      .select('readBy senderId chatId')
      .populate('readBy.userId', 'name profilePicture');

    if (!message) {
      throw new Error('Message not found');
    }

    return {
      messageId: message._id.toString(),
      senderId: message.senderId.toString(),
      readBy: message.readBy.map((r: any) => ({
        userId: r.userId._id?.toString() || r.userId.toString(),
        userName: r.userId.name,
        userPhoto: r.userId.profilePicture,
        readAt: r.readAt.toISOString(),
      })),
    };
  }
}

export const messageService = new MessageService();
