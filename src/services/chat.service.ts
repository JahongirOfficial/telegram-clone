import mongoose from 'mongoose';
import { Chat, IChat } from '../models/Chat.model';
import { User } from '../models/User.model';
import { Message } from '../models/Message.model';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ChatService {
  // Create a direct chat between two users
  async createDirectChat(userId: string, targetUserId: string): Promise<IChat> {
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Check if direct chat already exists between these users
    const existingChat = await Chat.findOne({
      type: 'direct',
      'participants.userId': { $all: [userId, targetUserId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new direct chat
    const chat = new Chat({
      type: 'direct',
      participants: [
        { userId: new mongoose.Types.ObjectId(userId), role: 'member' },
        { userId: new mongoose.Types.ObjectId(targetUserId), role: 'member' },
      ],
    });

    await chat.save();
    return chat;
  }

  // Create a group chat
  async createGroupChat(
    creatorId: string,
    participantIds: string[],
    name: string,
    description?: string,
    photo?: string
  ): Promise<IChat> {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Group name is required');
    }

    if (participantIds.length < 1) {
      throw new ValidationError('At least one participant is required');
    }

    // Verify all participants exist
    const users = await User.find({ _id: { $in: participantIds } });
    if (users.length !== participantIds.length) {
      throw new ValidationError('Some participants do not exist');
    }

    // Create participants array with creator
    const participants = [
      { userId: new mongoose.Types.ObjectId(creatorId), role: 'creator' as const },
      ...participantIds.map((id) => ({
        userId: new mongoose.Types.ObjectId(id),
        role: 'member' as const,
      })),
    ];

    const chat = new Chat({
      type: 'group',
      name: name.trim(),
      description: description?.trim(),
      photo,
      participants,
    });

    await chat.save();
    return chat;
  }

  // Get user's chats with populated participant info
  async getUserChats(userId: string): Promise<any[]> {
    const chats = await Chat.find({
      'participants.userId': userId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Populate participant info
    const populatedChats = await Promise.all(
      chats.map(async (chat) => {
        const participantIds = chat.participants.map((p) => p.userId);
        const users = await User.find({ _id: { $in: participantIds } })
          .select('_id name username profilePicture onlineStatus lastSeen')
          .lean();

        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        // For direct chats, get the other user's info
        let chatName = chat.name;
        let chatPhoto = chat.photo;
        let otherUser = null;

        if (chat.type === 'direct') {
          const otherParticipant = chat.participants.find(
            (p) => p.userId.toString() !== userId
          );
          if (otherParticipant) {
            const otherUserData = userMap.get(otherParticipant.userId.toString());
            if (otherUserData) {
              chatName = otherUserData.name;
              chatPhoto = otherUserData.profilePicture;
              otherUser = {
                id: otherUserData._id.toString(),
                name: otherUserData.name,
                username: otherUserData.username,
                profilePicture: otherUserData.profilePicture,
                onlineStatus: otherUserData.onlineStatus,
                lastSeen: otherUserData.lastSeen,
              };
            }
          }
        }

        // Count unread messages
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) },
        });

        return {
          id: chat._id,
          type: chat.type,
          name: chatName,
          photo: chatPhoto,
          description: chat.description,
          participants: chat.participants.map((p) => ({
            ...p,
            user: userMap.get(p.userId.toString()),
          })),
          lastMessage: chat.lastMessage,
          otherUser,
          unreadCount,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        };
      })
    );

    return populatedChats;
  }

  // Get single chat by ID
  async getChat(chatId: string, userId: string): Promise<any> {
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.userId': userId,
    }).lean();

    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Populate participant info
    const participantIds = chat.participants.map((p) => p.userId);
    const users = await User.find({ _id: { $in: participantIds } })
      .select('_id name username profilePicture onlineStatus lastSeen phoneNumber')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    let chatName = chat.name;
    let chatPhoto = chat.photo;
    let otherUser = null;

    if (chat.type === 'direct') {
      const otherParticipant = chat.participants.find(
        (p) => p.userId.toString() !== userId
      );
      if (otherParticipant) {
        const otherUserData = userMap.get(otherParticipant.userId.toString());
        if (otherUserData) {
          chatName = otherUserData.name;
          chatPhoto = otherUserData.profilePicture;
          otherUser = {
            id: otherUserData._id.toString(),
            name: otherUserData.name,
            username: otherUserData.username,
            profilePicture: otherUserData.profilePicture,
            onlineStatus: otherUserData.onlineStatus,
            lastSeen: otherUserData.lastSeen,
          };
        }
      }
    }

    return {
      id: chat._id,
      type: chat.type,
      name: chatName,
      photo: chatPhoto,
      description: chat.description,
      participants: chat.participants.map((p) => ({
        ...p,
        user: userMap.get(p.userId.toString()),
      })),
      lastMessage: chat.lastMessage,
      otherUser,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }

  // Update last message in chat
  async updateLastMessage(
    chatId: string,
    content: string,
    senderId: string
  ): Promise<void> {
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        content,
        senderId: new mongoose.Types.ObjectId(senderId),
        sentAt: new Date(),
      },
      updatedAt: new Date(),
    });
  }

  // Update group info
  async updateGroup(
    chatId: string,
    userId: string,
    updates: { name?: string; description?: string; photo?: string }
  ): Promise<any> {
    const chat = await Chat.findOne({
      _id: chatId,
      type: 'group',
      'participants.userId': userId,
    });

    if (!chat) {
      throw new NotFoundError('Group');
    }

    // Check if user is admin or creator
    const participant = chat.participants.find(
      (p) => p.userId.toString() === userId
    );
    if (!participant || participant.role === 'member') {
      throw new ValidationError('Only admins can update group info');
    }

    if (updates.name) chat.name = updates.name.trim();
    if (updates.description !== undefined) chat.description = updates.description?.trim();
    if (updates.photo !== undefined) chat.photo = updates.photo;

    await chat.save();
    return this.getChat(chatId, userId);
  }

  // Add members to group
  async addMembers(chatId: string, userId: string, memberIds: string[]): Promise<any> {
    const chat = await Chat.findOne({
      _id: chatId,
      type: 'group',
      'participants.userId': userId,
    });

    if (!chat) {
      throw new NotFoundError('Group');
    }

    // Check if user is admin or creator
    const participant = chat.participants.find(
      (p) => p.userId.toString() === userId
    );
    if (!participant || participant.role === 'member') {
      throw new ValidationError('Only admins can add members');
    }

    // Verify all new members exist
    const users = await User.find({ _id: { $in: memberIds } });
    if (users.length !== memberIds.length) {
      throw new ValidationError('Some users do not exist');
    }

    // Add new members (skip if already in group)
    const existingIds = chat.participants.map((p) => p.userId.toString());
    const newMembers = memberIds
      .filter((id) => !existingIds.includes(id))
      .map((id) => ({
        userId: new mongoose.Types.ObjectId(id),
        role: 'member' as const,
        joinedAt: new Date(),
      }));

    if (newMembers.length > 0) {
      chat.participants.push(...newMembers);
      await chat.save();
    }

    return this.getChat(chatId, userId);
  }

  // Remove member from group
  async removeMember(chatId: string, userId: string, memberId: string): Promise<any> {
    const chat = await Chat.findOne({
      _id: chatId,
      type: 'group',
      'participants.userId': userId,
    });

    if (!chat) {
      throw new NotFoundError('Group');
    }

    // Check if user is admin or creator (or removing themselves)
    const participant = chat.participants.find(
      (p) => p.userId.toString() === userId
    );
    const isRemovingSelf = userId === memberId;

    if (!isRemovingSelf && (!participant || participant.role === 'member')) {
      throw new ValidationError('Only admins can remove members');
    }

    // Cannot remove creator
    const memberToRemove = chat.participants.find(
      (p) => p.userId.toString() === memberId
    );
    if (memberToRemove?.role === 'creator') {
      throw new ValidationError('Cannot remove group creator');
    }

    chat.participants = chat.participants.filter(
      (p) => p.userId.toString() !== memberId
    );
    await chat.save();

    return this.getChat(chatId, userId);
  }

  // Leave group
  async leaveGroup(chatId: string, userId: string): Promise<void> {
    await this.removeMember(chatId, userId, userId);
  }
}

export const chatService = new ChatService();
