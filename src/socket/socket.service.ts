import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User.model';
import { Chat } from '../models/Chat.model';
import { JWTPayload } from '../models/types';

interface SocketUser {
  userId: string;
  sockets: Set<string>;
}

// Store online users: userId -> SocketUser
const onlineUsers = new Map<string, SocketUser>();

export class SocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
        socket.data.userId = payload.userId;
        socket.data.phoneNumber = payload.phoneNumber;
        
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: Socket) => {
      const userId = socket.data.userId;
      console.log(`User connected: ${userId}, socket: ${socket.id}`);

      // Add user to online users
      await this.handleUserOnline(userId, socket.id);

      // Join user's chat rooms
      await this.joinUserChats(socket, userId);

      // Handle typing events
      socket.on('typing:start', (data: { chatId: string }) => {
        this.handleTypingStart(socket, userId, data.chatId);
      });

      socket.on('typing:stop', (data: { chatId: string }) => {
        this.handleTypingStop(socket, userId, data.chatId);
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${userId}, socket: ${socket.id}`);
        await this.handleUserOffline(userId, socket.id);
      });

      // Handle joining a specific chat room
      socket.on('chat:join', (chatId: string) => {
        console.log(`Socket ${socket.id} joining chat room: chat:${chatId}`);
        socket.join(`chat:${chatId}`);
        const rooms = this.io.sockets.adapter.rooms.get(`chat:${chatId}`);
        console.log(`Chat room chat:${chatId} now has ${rooms?.size || 0} sockets`);
      });

      // Handle leaving a chat room
      socket.on('chat:leave', (chatId: string) => {
        socket.leave(`chat:${chatId}`);
      });

      // Handle message seen event
      socket.on('message:markSeen', async (data: { chatId: string; messageIds?: string[] }) => {
        await this.handleMessageSeen(socket, userId, data.chatId, data.messageIds);
      });
    });
  }

  private async handleMessageSeen(socket: Socket, userId: string, chatId: string, messageIds?: string[]) {
    try {
      // Import message service dynamically to avoid circular dependency
      const { messageService } = await import('../services/message.service');
      await messageService.markAsRead(chatId, userId, messageIds);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }

  private async handleUserOnline(userId: string, socketId: string) {
    let userSockets = onlineUsers.get(userId);
    
    if (!userSockets) {
      userSockets = { userId: userId, sockets: new Set() };
      onlineUsers.set(userId, userSockets);
    }
    
    userSockets.sockets.add(socketId);

    // Update user status in database
    await User.findByIdAndUpdate(userId, {
      onlineStatus: 'online',
    });

    // Broadcast online status to user's contacts
    await this.broadcastUserStatus(userId, 'online');
  }

  private async handleUserOffline(userId: string, socketId: string) {
    const userSockets = onlineUsers.get(userId);
    
    if (userSockets) {
      userSockets.sockets.delete(socketId);
      
      // Only mark as offline if no more sockets
      if (userSockets.sockets.size === 0) {
        onlineUsers.delete(userId);
        
        // Update user status in database
        await User.findByIdAndUpdate(userId, {
          onlineStatus: 'offline',
          lastSeen: new Date(),
        });

        // Broadcast offline status
        await this.broadcastUserStatus(userId, 'offline');
      }
    }
  }

  private async broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    console.log(`Broadcasting user status: ${userId} is now ${status}`);
    
    // Get user's chats to find who to notify
    const chats = await Chat.find({
      'participants.userId': userId,
    }).select('participants');

    console.log(`Found ${chats.length} chats for user ${userId}`);

    // Get unique participant IDs (excluding the user)
    const participantIds = new Set<string>();
    chats.forEach(chat => {
      chat.participants.forEach(p => {
        if (p.userId.toString() !== userId) {
          participantIds.add(p.userId.toString());
        }
      });
    });

    console.log(`Will notify ${participantIds.size} participants:`, Array.from(participantIds));

    // Get user info for the broadcast
    const user = await User.findById(userId).select('_id name lastSeen');

    // Emit to each online participant
    participantIds.forEach(participantId => {
      const participantSockets = onlineUsers.get(participantId);
      console.log(`Participant ${participantId} online sockets:`, participantSockets?.sockets.size || 0);
      if (participantSockets) {
        participantSockets.sockets.forEach(socketId => {
          console.log(`Emitting user:status to socket ${socketId}`);
          this.io.to(socketId).emit('user:status', {
            userId: userId,
            status,
            lastSeen: user?.lastSeen,
          });
        });
      }
    });
  }

  private async joinUserChats(socket: Socket, userId: string) {
    const chats = await Chat.find({
      'participants.userId': userId,
    }).select('_id');

    chats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });
  }

  private async handleTypingStart(socket: Socket, userId: string, chatId: string) {
    console.log(`User ${userId} started typing in chat ${chatId}`);
    const user = await User.findById(userId).select('name');
    
    const rooms = this.io.sockets.adapter.rooms.get(`chat:${chatId}`);
    console.log(`Chat room chat:${chatId} has ${rooms?.size || 0} sockets`);
    
    socket.to(`chat:${chatId}`).emit('typing:update', {
      chatId,
      userId: userId,
      userName: user?.name,
      isTyping: true,
    });
    console.log(`Emitted typing:update (start) to chat:${chatId}`);
  }

  private async handleTypingStop(socket: Socket, userId: string, chatId: string) {
    console.log(`User ${userId} stopped typing in chat ${chatId}`);
    socket.to(`chat:${chatId}`).emit('typing:update', {
      chatId,
      userId: userId,
      isTyping: false,
    });
    console.log(`Emitted typing:update (stop) to chat:${chatId}`);
  }

  // Public methods for emitting events from other parts of the app
  public emitToUser(userId: string, event: string, data: any) {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  // Emit unread count update to a specific user
  public emitUnreadUpdate(userId: string, chatId: string, unreadCount: number) {
    this.emitToUser(userId, 'chat:unreadUpdate', { chatId, unreadCount });
  }

  public isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(onlineUsers.keys());
  }
}

let socketService: SocketService | null = null;

export const initializeSocket = (httpServer: HttpServer): SocketService => {
  socketService = new SocketService(httpServer);
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
};
