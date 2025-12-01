import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (phoneNumber: string) =>
    api.post('/auth/login', { phoneNumber }),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),
};

// User API
export const userApi = {
  // GET /users/me - Get current user profile
  getMe: () => api.get('/users/me'),

  // PUT /users/me/update - Update profile (name, username, bio)
  updateProfile: (data: {
    name?: string;
    username?: string;
    bio?: string;
  }) => api.put('/users/me/update', data),

  // PUT /users/me/photo - Update profile photo
  updatePhoto: (profilePicture: string) => 
    api.put('/users/me/photo', { profilePicture }),

  // POST /users/profile - Create profile (for new users)
  createProfile: (data: {
    name: string;
    username?: string;
    bio?: string;
    profilePicture?: string;
  }) => api.post('/users/profile', data),

  // GET /users/:id - Get user by ID
  getUser: (userId: string) => api.get(`/users/${userId}`),

  // GET /users/search - Search users
  searchUsers: (query: string) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
};

// Chat API
export const chatApi = {
  // POST /chats/create - Create a new chat
  createChat: (data: {
    type: 'direct' | 'group';
    targetUserId?: string;
    participantIds?: string[];
    name?: string;
    description?: string;
    photo?: string;
  }) => api.post('/chats/create', data),

  // GET /chats/my - Get user's chats
  getMyChats: () => api.get('/chats/my'),

  // GET /chats/:id - Get single chat
  getChat: (chatId: string) => api.get(`/chats/${chatId}`),

  // PUT /chats/:id - Update group info
  updateGroup: (chatId: string, data: { name?: string; description?: string; photo?: string }) =>
    api.put(`/chats/${chatId}`, data),

  // POST /chats/:id/members - Add members to group
  addMembers: (chatId: string, memberIds: string[]) =>
    api.post(`/chats/${chatId}/members`, { memberIds }),

  // DELETE /chats/:id/members/:memberId - Remove member from group
  removeMember: (chatId: string, memberId: string) =>
    api.delete(`/chats/${chatId}/members/${memberId}`),

  // POST /chats/:id/leave - Leave group
  leaveGroup: (chatId: string) => api.post(`/chats/${chatId}/leave`),
};

// Message API
export const messageApi = {
  // GET /messages/:chatId - Get messages for a chat
  getMessages: (chatId: string, params?: { limit?: number; before?: string }) =>
    api.get(`/messages/${chatId}`, { params }),

  // POST /messages/send - Send a message
  sendMessage: (data: {
    chatId: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'voice' | 'video';
    replyTo?: string;
  }) => api.post('/messages/send', data),

  // POST /messages/send-image - Send an image message
  sendImage: (chatId: string, imageFile: File, replyTo?: string) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('image', imageFile);
    if (replyTo) {
      formData.append('replyTo', replyTo);
    }
    return api.post('/messages/send-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // POST /messages/send-video - Send a video message
  sendVideo: (chatId: string, videoFile: File, replyTo?: string) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('video', videoFile);
    if (replyTo) {
      formData.append('replyTo', replyTo);
    }
    return api.post('/messages/send-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // POST /messages/send-file - Send a file message
  sendFile: (chatId: string, file: File, replyTo?: string) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('file', file);
    if (replyTo) {
      formData.append('replyTo', replyTo);
    }
    return api.post('/messages/send-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // POST /messages/:chatId/read - Mark messages as read
  markAsRead: (chatId: string) => api.post(`/messages/${chatId}/read`),
};

// Notification API
export const notificationApi = {
  // GET /notifications/unread-counts - Get unread counts for all chats
  getUnreadCounts: () => api.get('/notifications/unread-counts'),

  // GET /notifications/total-unread - Get total unread count
  getTotalUnread: () => api.get('/notifications/total-unread'),

  // GET /notifications - Get user notifications
  getNotifications: (limit?: number) =>
    api.get('/notifications', { params: { limit } }),

  // POST /notifications/mark-read/:chatId - Mark chat notifications as read
  markChatRead: (chatId: string) =>
    api.post(`/notifications/mark-read/${chatId}`),
};

// Settings API
export const settingsApi = {
  // GET /settings - Get user settings
  getSettings: () => api.get('/settings'),

  // PUT /settings - Update user settings
  updateSettings: (data: {
    privacy?: {
      lastSeen?: 'everyone' | 'contacts' | 'nobody';
      profilePhoto?: 'everyone' | 'contacts' | 'nobody';
      onlineStatus?: 'everyone' | 'contacts' | 'nobody';
      readReceipts?: boolean;
    };
    notifications?: {
      messages?: boolean;
      groups?: boolean;
      sounds?: boolean;
      vibration?: boolean;
      preview?: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
    language?: string;
  }) => api.put('/settings', data),
};

export interface ApiError {
  code: string;
  message: string;
  details?: {
    attemptsRemaining?: number;
  };
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error as ApiError;
    return apiError?.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
};
