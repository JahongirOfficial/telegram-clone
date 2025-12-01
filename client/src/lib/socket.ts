import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const eventCallbacks: Map<string, Set<Function>> = new Map();

export interface UserStatusUpdate {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

export interface TypingUpdate {
  chatId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
}

export interface MessageSeenUpdate {
  chatId: string;
  readBy: {
    userId: string;
    readAt: string;
  };
  messageIds: string[];
}

export interface UnreadCountUpdate {
  chatId: string;
  unreadCount: number;
}

const setupEventForwarding = () => {
  if (!socket) return;

  socket.on('user:status', (data) => {
    console.log('Received user:status event:', data);
    eventCallbacks.get('user:status')?.forEach((cb) => cb(data));
  });

  socket.on('typing:update', (data) => {
    console.log('Received typing:update event:', data);
    eventCallbacks.get('typing:update')?.forEach((cb) => cb(data));
  });

  socket.on('message:new', (data) => {
    console.log('Received message:new event:', data);
    eventCallbacks.get('message:new')?.forEach((cb) => cb(data));
  });

  socket.on('message:seen', (data) => {
    console.log('Received message:seen event:', data);
    eventCallbacks.get('message:seen')?.forEach((cb) => cb(data));
  });

  socket.on('chat:unreadUpdate', (data) => {
    console.log('Received chat:unreadUpdate event:', data);
    eventCallbacks.get('chat:unreadUpdate')?.forEach((cb) => cb(data));
  });
};

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  socket = io(apiUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  setupEventForwarding();

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  eventCallbacks.clear();
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const startTyping = (chatId: string) => {
  console.log('Emitting typing:start for chat:', chatId);
  socket?.emit('typing:start', { chatId });
};

export const stopTyping = (chatId: string) => {
  console.log('Emitting typing:stop for chat:', chatId);
  socket?.emit('typing:stop', { chatId });
};

export const joinChat = (chatId: string) => {
  console.log('Joining chat room:', chatId);
  socket?.emit('chat:join', chatId);
};

export const leaveChat = (chatId: string) => {
  socket?.emit('chat:leave', chatId);
};

export const onUserStatus = (callback: (data: UserStatusUpdate) => void) => {
  if (!eventCallbacks.has('user:status')) {
    eventCallbacks.set('user:status', new Set());
  }
  eventCallbacks.get('user:status')!.add(callback);

  return () => {
    eventCallbacks.get('user:status')?.delete(callback);
  };
};

export const onTypingUpdate = (callback: (data: TypingUpdate) => void) => {
  if (!eventCallbacks.has('typing:update')) {
    eventCallbacks.set('typing:update', new Set());
  }
  eventCallbacks.get('typing:update')!.add(callback);

  return () => {
    eventCallbacks.get('typing:update')?.delete(callback);
  };
};

export const onNewMessage = (callback: (data: any) => void) => {
  if (!eventCallbacks.has('message:new')) {
    eventCallbacks.set('message:new', new Set());
  }
  eventCallbacks.get('message:new')!.add(callback);

  return () => {
    eventCallbacks.get('message:new')?.delete(callback);
  };
};

export const onMessageSeen = (callback: (data: MessageSeenUpdate) => void) => {
  if (!eventCallbacks.has('message:seen')) {
    eventCallbacks.set('message:seen', new Set());
  }
  eventCallbacks.get('message:seen')!.add(callback);

  return () => {
    eventCallbacks.get('message:seen')?.delete(callback);
  };
};

export const markMessagesSeen = (chatId: string, messageIds?: string[]) => {
  console.log('Emitting message:markSeen for chat:', chatId, 'messages:', messageIds);
  socket?.emit('message:markSeen', { chatId, messageIds });
};

export const onUnreadCountUpdate = (callback: (data: UnreadCountUpdate) => void) => {
  if (!eventCallbacks.has('chat:unreadUpdate')) {
    eventCallbacks.set('chat:unreadUpdate', new Set());
  }
  eventCallbacks.get('chat:unreadUpdate')!.add(callback);

  return () => {
    eventCallbacks.get('chat:unreadUpdate')?.delete(callback);
  };
};
