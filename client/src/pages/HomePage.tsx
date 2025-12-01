import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  Menu,
  Settings,
  LogOut,
  User,
  X,
  Loader2,
  Send,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Mic,
  ArrowLeft,
  Image as ImageIcon,
  Users,
  FileText,
  Download,
} from 'lucide-react';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import { useAuthStore } from '@/store/auth.store';
import { userApi, authApi, chatApi, messageApi, notificationApi, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  connectSocket,
  disconnectSocket,
  onUserStatus,
  onTypingUpdate,
  onNewMessage,
  onMessageSeen,
  onUnreadCountUpdate,
  startTyping,
  stopTyping,
  joinChat,
  markMessagesSeen,
  UserStatusUpdate,
  TypingUpdate,
  MessageSeenUpdate,
  UnreadCountUpdate,
} from '@/lib/socket';

interface SearchUser {
  id: string;
  name: string;
  username?: string;
  profilePicture?: string;
  onlineStatus: string;
  lastSeen: string;
}

interface ChatItem {
  id: string;
  type: 'direct' | 'group';
  name: string;
  photo?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: string;
  };
  otherUser?: SearchUser;
  updatedAt: string;
}

interface ReadByItem {
  userId: string;
  readAt: string;
}

interface MessageItem {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  type: string;
  readBy?: ReadByItem[];
  createdAt: string;
}


export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout, isAuthenticated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Chat states
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Group modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Message input
  const [messageInput, setMessageInput] = useState('');

  // Online/Typing states
  const [userStatuses, setUserStatuses] = useState<Map<string, { status: string; lastSeen?: string }>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, { userName?: string; timeout: NodeJS.Timeout }>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Messages states
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Unread counts state
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  // Media upload states
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'file' | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        const [profileRes, chatsRes, unreadRes] = await Promise.all([
          userApi.getMe(),
          chatApi.getMyChats(),
          notificationApi.getUnreadCounts(),
        ]);
        setUser(profileRes.data.data);
        setChats(chatsRes.data.data);
        // Set unread counts
        const countsMap = new Map<string, number>();
        unreadRes.data.data.forEach((item: { chatId: string; unreadCount: number }) => {
          countsMap.set(item.chatId, item.unreadCount);
        });
        setUnreadCounts(countsMap);
        const token = localStorage.getItem('accessToken');
        if (token) connectSocket(token);
      } catch (err) {
        console.error(getErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsLoadingChats(false);
      }
    };
    loadData();
    return () => disconnectSocket();
  }, [isAuthenticated, navigate, setUser]);

  useEffect(() => {
    const unsubStatus = onUserStatus((data: UserStatusUpdate) => {
      setUserStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, { status: data.status, lastSeen: data.lastSeen });
        return newMap;
      });
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.otherUser?.id === data.userId) {
            return { ...chat, otherUser: { ...chat.otherUser, onlineStatus: data.status, lastSeen: data.lastSeen || chat.otherUser.lastSeen } };
          }
          return chat;
        })
      );
    });

    const unsubTyping = onTypingUpdate((data: TypingUpdate) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const key = `${data.chatId}:${data.userId}`;
        const existing = prev.get(key);
        if (existing?.timeout) clearTimeout(existing.timeout);
        if (data.isTyping) {
          const timeout = setTimeout(() => {
            setTypingUsers((p) => { const m = new Map(p); m.delete(key); return m; });
          }, 3000);
          newMap.set(key, { userName: data.userName, timeout });
        } else {
          newMap.delete(key);
        }
        return newMap;
      });
    });

    const unsubUnread = onUnreadCountUpdate((data: UnreadCountUpdate) => {
      setUnreadCounts((prev) => {
        const newMap = new Map(prev);
        if (data.unreadCount > 0) {
          newMap.set(data.chatId, data.unreadCount);
        } else {
          newMap.delete(data.chatId);
        }
        return newMap;
      });
    });

    return () => { unsubStatus?.(); unsubTyping?.(); unsubUnread?.(); };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      joinChat(selectedChat.id);
      loadMessages(selectedChat.id);
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    const unsubNewMessage = onNewMessage((data: MessageItem) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        // Mark incoming messages as seen if chat is open and message is not from current user
        if (data.senderId !== user?.id) {
          markMessagesSeen(selectedChat.id, [data.id]);
        }
      }
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === data.chatId) {
            return { ...chat, lastMessage: { content: data.content, senderId: data.senderId, sentAt: data.createdAt } };
          }
          return chat;
        })
      );
    });

    const unsubMessageSeen = onMessageSeen((data: MessageSeenUpdate) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (data.messageIds.includes(msg.id)) {
              const existingReadBy = msg.readBy || [];
              const alreadyRead = existingReadBy.some((r) => r.userId === data.readBy.userId);
              if (!alreadyRead) {
                return {
                  ...msg,
                  readBy: [...existingReadBy, data.readBy],
                };
              }
            }
            return msg;
          })
        );
      }
    });

    return () => {
      unsubNewMessage?.();
      unsubMessageSeen?.();
    };
  }, [selectedChat?.id, user?.id]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await messageApi.getMessages(chatId);
      const loadedMessages = response.data.data;
      setMessages(loadedMessages);

      // Mark all unread messages as seen
      const unreadMessageIds = loadedMessages
        .filter((msg: MessageItem) => {
          const isOwnMessage = String(msg.senderId) === String(user?.id);
          const alreadyRead = msg.readBy?.some((r: ReadByItem) => r.userId === user?.id);
          return !isOwnMessage && !alreadyRead;
        })
        .map((msg: MessageItem) => msg.id);

      if (unreadMessageIds.length > 0) {
        markMessagesSeen(chatId, unreadMessageIds);
      }
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
      setIsSearching(true);
      try {
        const response = await userApi.searchUsers(searchQuery);
        setSearchResults(response.data.data);
      } catch (err) {
        console.error(getErrorMessage(err));
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (err) { console.error(getErrorMessage(err)); }
    finally { logout(); navigate('/login'); }
  };

  const handleUserSelect = async (selectedUser: SearchUser) => {
    setSearchQuery(''); setSearchResults([]); setIsSearchFocused(false);
    try {
      const response = await chatApi.createChat({ type: 'direct', targetUserId: selectedUser.id });
      const chat = response.data.data;
      setChats((prev) => { const exists = prev.find((c) => c.id === chat.id); if (exists) return prev; return [chat, ...prev]; });
      setSelectedChat(chat);
    } catch (err) { console.error(getErrorMessage(err)); }
  };

  const handleChatSelect = (chat: ChatItem) => {
    setSelectedChat(chat);
    setMessages([]);
    // Clear unread count for this chat
    setUnreadCounts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(chat.id);
      return newMap;
    });
  };

  const handleBackToChats = () => { setSelectedChat(null); };

  const handleGroupCreated = (chat: ChatItem) => {
    setChats((prev) => [chat, ...prev]);
    setSelectedChat(chat);
    setIsCreateGroupOpen(false);
  };

  // Media handling (image & video)
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      console.error('Please select an image or video file');
      return;
    }

    // Validate file size
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
    if (file.size > maxSize) {
      console.error(`File size must be less than ${isVideo ? '100MB' : '10MB'}`);
      return;
    }

    setSelectedMedia(file);
    setMediaType(isImage ? 'image' : 'video');

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For video, create object URL for preview
      const videoUrl = URL.createObjectURL(file);
      setMediaPreview(videoUrl);
    }
  };

  const handleCancelMedia = () => {
    if (mediaPreview && mediaType === 'video') {
      URL.revokeObjectURL(mediaPreview);
    }
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };

  const handleSendMedia = async () => {
    if (!selectedChat || !selectedMedia || isUploadingMedia) return;

    setIsUploadingMedia(true);
    try {
      if (mediaType === 'image') {
        await messageApi.sendImage(selectedChat.id, selectedMedia);
      } else if (mediaType === 'video') {
        await messageApi.sendVideo(selectedChat.id, selectedMedia);
      } else if (mediaType === 'file') {
        await messageApi.sendFile(selectedChat.id, selectedMedia);
      }
      handleCancelMedia();
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 50MB for files
    if (file.size > 50 * 1024 * 1024) {
      console.error('File size must be less than 50MB');
      return;
    }

    setSelectedMedia(file);
    setMediaType('file');
    setMediaPreview(null); // No preview for files
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !messageInput.trim() || isSending) return;
    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);
    if (isTypingRef.current) { isTypingRef.current = false; stopTyping(selectedChat.id); }
    try { await messageApi.sendMessage({ chatId: selectedChat.id, content }); }
    catch (err) { console.error(getErrorMessage(err)); setMessageInput(content); }
    finally { setIsSending(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    if (!selectedChat) return;
    if (value && !isTypingRef.current) { isTypingRef.current = true; startTyping(selectedChat.id); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedChat && isTypingRef.current) { isTypingRef.current = false; stopTyping(selectedChat.id); }
    }, 2000);
    if (!value && isTypingRef.current) { isTypingRef.current = false; stopTyping(selectedChat.id); }
  }, [selectedChat]);

  const getTypingText = useCallback(() => {
    if (!selectedChat) return null;
    const typingInChat: string[] = [];
    typingUsers.forEach((value, key) => { if (key.startsWith(`${selectedChat.id}:`)) typingInChat.push(value.userName || 'Someone'); });
    if (typingInChat.length === 0) return null;
    if (typingInChat.length === 1) return `${typingInChat[0]} is typing...`;
    return `${typingInChat.join(', ')} are typing...`;
  }, [selectedChat, typingUsers]);

  const getUserStatus = useCallback((userId: string, initialStatus?: string, initialLastSeen?: string) => {
    const realtimeStatus = userStatuses.get(userId);
    if (realtimeStatus) return { status: realtimeStatus.status, lastSeen: realtimeStatus.lastSeen };
    return { status: initialStatus || 'offline', lastSeen: initialLastSeen };
  }, [userStatuses]);

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Just now (less than 1 minute)
    if (diffMins < 1) return 'just now';

    // Minutes ago (1-59 minutes)
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;

    // Today - show time
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // This week (2-6 days ago)
    if (diffDays < 7) {
      const dayName = date.toLocaleDateString([], { weekday: 'long' });
      return `${dayName} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Older - show full date
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0e1621] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#3390ec] animate-spin" />
      </div>
    );
  }


  return (
    <div className="h-screen flex overflow-hidden bg-[#0e1621]">
      {/* Left Panel - Chat List */}
      <aside className={cn(
        'bg-[#17212b] flex flex-col border-r border-[#0e1621]',
        'w-full md:w-[420px] md:min-w-[320px] lg:w-[380px] xl:w-[420px]',
        isMobileView && selectedChat ? 'hidden' : 'flex'
      )}>
        {/* Header */}
        <header className="h-14 px-4 flex items-center gap-3 bg-[#17212b]">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
            <Menu className="w-5 h-5 text-[#aaaaaa]" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-[#242f3d] rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-[#6c7883] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#6c7883] hover:text-white" />
              </button>
            )}
            {/* Search Dropdown */}
            {isSearchFocused && (searchQuery.length >= 2 || searchResults.length > 0) && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSearchFocused(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#17212b] border border-[#0e1621] rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-[#3390ec] animate-spin" /></div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((result) => (
                        <button key={result.id} onClick={() => handleUserSelect(result)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#232e3c] transition-colors">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center">
                              {result.profilePicture ? <img src={result.profilePicture} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-white font-medium">{getInitials(result.name)}</span>}
                            </div>
                            {result.onlineStatus === 'online' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4dcd5e] rounded-full border-2 border-[#17212b]" />}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium">{result.name}</p>
                            <p className="text-[#6c7883] text-sm">{result.onlineStatus === 'online' ? 'online' : `last seen ${formatLastSeen(result.lastSeen)}`}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="py-8 text-center"><p className="text-[#6c7883]">No users found</p></div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute top-14 left-2 w-64 bg-[#17212b] border border-[#0e1621] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 bg-[#232e3c]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center">
                    {user?.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-white font-bold">{user?.name ? getInitials(user.name) : 'U'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user?.name}</p>
                    <p className="text-[#6c7883] text-sm truncate">{user?.phoneNumber}</p>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <button onClick={() => { setIsMenuOpen(false); setIsCreateGroupOpen(true); }} className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-[#232e3c] transition-colors">
                  <Users className="w-5 h-5 text-[#6c7883]" /><span className="text-white">New Group</span>
                </button>
                <button onClick={() => { setIsMenuOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-[#232e3c] transition-colors">
                  <User className="w-5 h-5 text-[#6c7883]" /><span className="text-white">My Profile</span>
                </button>
                <button onClick={() => { setIsMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-[#232e3c] transition-colors">
                  <Settings className="w-5 h-5 text-[#6c7883]" /><span className="text-white">Settings</span>
                </button>
              </div>
              <div className="border-t border-[#0e1621] py-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-[#232e3c] transition-colors text-[#e53935]">
                  <LogOut className="w-5 h-5" /><span>Log Out</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-[#3390ec] animate-spin" /></div>
          ) : chats.length > 0 ? (
            <div>
              {chats.map((chat) => {
                const otherUserId = chat.otherUser?.id;
                const userStatus = otherUserId ? getUserStatus(otherUserId, chat.otherUser?.onlineStatus, chat.otherUser?.lastSeen) : null;
                const isOnline = userStatus?.status === 'online';
                const isGroup = chat.type === 'group';
                let chatTypingText: string | null = null;
                typingUsers.forEach((_, key) => { if (key.startsWith(`${chat.id}:`)) chatTypingText = 'typing...'; });

                const chatUnreadCount = unreadCounts.get(chat.id) || 0;

                return (
                  <button
                    key={chat.id}
                    onClick={() => handleChatSelect(chat)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2 transition-colors', selectedChat?.id === chat.id ? 'bg-[#3390ec]' : 'hover:bg-[#232e3c]')}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-[54px] h-[54px] rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center">
                        {chat.photo ? (
                          <img src={chat.photo} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : isGroup ? (
                          <Users className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-white text-lg font-medium">{getInitials(chat.name)}</span>
                        )}
                      </div>
                      {!isGroup && isOnline && <div className={cn('absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#4dcd5e] rounded-full border-2', selectedChat?.id === chat.id ? 'border-[#3390ec]' : 'border-[#17212b]')} />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={cn('font-medium truncate', selectedChat?.id === chat.id ? 'text-white' : 'text-white')}>{chat.name}</p>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {chat.lastMessage && <span className={cn('text-xs', selectedChat?.id === chat.id ? 'text-white/80' : 'text-[#6c7883]')}>{formatMessageTime(chat.lastMessage.sentAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm truncate flex-1', chatTypingText ? 'text-[#4dcd5e]' : selectedChat?.id === chat.id ? 'text-white/80' : 'text-[#6c7883]')}>
                          {chatTypingText || chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {chatUnreadCount > 0 && selectedChat?.id !== chat.id && (
                          <span className="ml-2 min-w-[20px] h-5 px-1.5 bg-[#3390ec] text-white text-xs font-medium rounded-full flex items-center justify-center">
                            {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageCircle className="w-16 h-16 text-[#3390ec] mb-4" />
              <h3 className="text-white font-medium mb-2">No chats yet</h3>
              <p className="text-[#6c7883] text-sm">Search for users to start messaging</p>
            </div>
          )}
        </div>
      </aside>


      {/* Right Panel - Chat Area */}
      <main className={cn(
        'flex-1 flex flex-col min-w-0',
        isMobileView && !selectedChat ? 'hidden' : 'flex'
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            {(() => {
              const otherUserId = selectedChat.otherUser?.id;
              const userStatus = otherUserId ? getUserStatus(otherUserId, selectedChat.otherUser?.onlineStatus, selectedChat.otherUser?.lastSeen) : null;
              const isOnline = userStatus?.status === 'online';
              const typingText = getTypingText();
              const isGroup = selectedChat.type === 'group';
              const memberCount = (selectedChat as any).participants?.length || 0;

              return (
                <header className="h-14 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 bg-[#17212b] border-b border-[#0e1621]">
                  {/* Back button for mobile */}
                  {isMobileView && (
                    <button
                      onClick={handleBackToChats}
                      className="p-2 rounded-full hover:bg-[#232e3c] transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#aaaaaa]" />
                    </button>
                  )}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center">
                      {selectedChat.photo ? (
                        <img src={selectedChat.photo} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : isGroup ? (
                        <Users className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-medium text-sm">{getInitials(selectedChat.name)}</span>
                      )}
                    </div>
                    {!isGroup && isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4dcd5e] rounded-full border-2 border-[#17212b]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-medium truncate text-sm sm:text-base">{selectedChat.name}</h2>
                    <p className={cn('text-xs sm:text-sm truncate', typingText ? 'text-[#3390ec]' : 'text-[#6c7883]')}>
                      {typingText || (isGroup ? `${memberCount} members` : isOnline ? 'online' : userStatus?.lastSeen ? `last seen ${formatLastSeen(userStatus.lastSeen)}` : '')}
                    </p>
                  </div>
                </header>
              );
            })()}

            {/* Messages Area with Pattern Background */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto"
              style={{
                backgroundColor: '#0e1621',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182533' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <div className="max-w-[800px] mx-auto px-2 sm:px-4 py-2 sm:py-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#3390ec] animate-spin" /></div>
                ) : messages.length > 0 ? (
                  <div className="space-y-1">
                    {messages.map((msg, index) => {
                      const isOwn = String(msg.senderId) === String(user?.id);
                      const showTime = index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                      // Check if message is read by other users (not the sender)
                      const isRead = isOwn && msg.readBy && msg.readBy.some((r) => r.userId !== user?.id);

                      return (
                        <React.Fragment key={msg.id}>
                          {showTime && (
                            <div className="flex justify-center my-4">
                              <span className="bg-[#182533]/80 text-[#6c7883] text-xs px-3 py-1 rounded-full">
                                {new Date(msg.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                          <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                            <div
                              className={cn(
                                'max-w-[85%] sm:max-w-[65%] px-2.5 sm:px-3 py-1.5 relative group',
                                isOwn
                                  ? 'bg-[#2b5278] rounded-2xl rounded-br-sm'
                                  : 'bg-[#182533] rounded-2xl rounded-bl-sm'
                              )}
                            >
                              {!isOwn && selectedChat.type === 'group' && (
                                <p className="text-[#3390ec] text-sm font-medium mb-0.5">{msg.senderName}</p>
                              )}
                              {msg.type === 'image' ? (
                                <img
                                  src={msg.content}
                                  alt="Sent image"
                                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  style={{ maxHeight: '300px' }}
                                  onClick={() => window.open(msg.content, '_blank')}
                                />
                              ) : msg.type === 'video' ? (
                                <video
                                  src={msg.content}
                                  controls
                                  className="max-w-full rounded-lg"
                                  style={{ maxHeight: '300px' }}
                                  preload="metadata"
                                />
                              ) : msg.type === 'file' ? (
                                (() => {
                                  try {
                                    const fileData = JSON.parse(msg.content);
                                    return (
                                      <a
                                        href={fileData.url}
                                        download={fileData.name}
                                        className="flex items-center gap-3 p-3 bg-[#1a2836] rounded-lg hover:bg-[#1e3044] transition-colors min-w-[200px]"
                                      >
                                        <div className="w-10 h-10 rounded-lg bg-[#3390ec]/20 flex items-center justify-center flex-shrink-0">
                                          <span className="text-xl">{getFileIcon(fileData.mimeType)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-white text-sm font-medium truncate">{fileData.name}</p>
                                          <p className="text-[#6c7883] text-xs">{formatFileSize(fileData.size)}</p>
                                        </div>
                                        <Download className="w-5 h-5 text-[#3390ec] flex-shrink-0" />
                                      </a>
                                    );
                                  } catch {
                                    return <p className="text-white text-sm">File</p>;
                                  }
                                })()
                              ) : (
                                <p className="text-white text-sm sm:text-[15px] leading-5 sm:leading-[22px] break-words whitespace-pre-wrap">{msg.content}</p>
                              )}
                              <div className={cn('flex items-center justify-end gap-1 mt-0.5', isOwn ? 'text-[#6c9dc0]' : 'text-[#6c7883]')}>
                                <span className="text-[11px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isOwn && (
                                  isRead ? (
                                    <CheckCheck className="w-4 h-4 text-[#4dcd5e]" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center mx-auto mb-4">
                        {selectedChat.photo ? <img src={selectedChat.photo} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-white text-3xl font-bold">{getInitials(selectedChat.name)}</span>}
                      </div>
                      <h3 className="text-white font-medium text-xl mb-1">{selectedChat.name}</h3>
                      <p className="text-[#6c7883]">No messages here yet...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Preview (Image, Video, or File) */}
            {(mediaPreview || mediaType === 'file') && selectedMedia && (
              <div className="bg-[#17212b] border-t border-[#0e1621] px-2 sm:px-4 py-2">
                <div className="max-w-[800px] mx-auto">
                  <div className="relative inline-block">
                    {mediaType === 'image' ? (
                      <img
                        src={mediaPreview!}
                        alt="Preview"
                        className="max-h-32 sm:max-h-48 rounded-lg"
                      />
                    ) : mediaType === 'video' ? (
                      <video
                        src={mediaPreview!}
                        className="max-h-32 sm:max-h-48 rounded-lg"
                        controls
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-[#232e3c] rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-[#3390ec]/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#3390ec]" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium truncate max-w-[200px]">{selectedMedia.name}</p>
                          <p className="text-[#6c7883] text-xs">{formatFileSize(selectedMedia.size)}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleCancelMedia}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-[#17212b] border-t border-[#0e1621] px-2 sm:px-4 py-2 sm:py-3">
              <div className="max-w-[800px] mx-auto flex items-center gap-1 sm:gap-2">
                {/* Media picker button (image & video) */}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                {/* File picker button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-[#232e3c] transition-colors"
                  disabled={isUploadingMedia}
                >
                  <ImageIcon className="w-5 h-5 text-[#6c7883]" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-[#232e3c] transition-colors"
                  disabled={isUploadingMedia}
                >
                  <Paperclip className="w-5 h-5 text-[#6c7883]" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={messageInput}
                    onChange={handleMessageInputChange}
                    onKeyDown={handleKeyPress}
                    onBlur={() => { if (selectedChat && isTypingRef.current) { isTypingRef.current = false; stopTyping(selectedChat.id); } }}
                    className="w-full bg-[#242f3d] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-white placeholder-[#6c7883] focus:outline-none text-sm sm:text-[15px]"
                    disabled={!!selectedMedia}
                  />
                </div>
                <button className="p-1.5 sm:p-2 rounded-full hover:bg-[#232e3c] transition-colors hidden sm:block">
                  <Smile className="w-5 h-5 text-[#6c7883]" />
                </button>
                {selectedMedia ? (
                  <button
                    onClick={handleSendMedia}
                    disabled={isUploadingMedia}
                    className="p-1.5 sm:p-2 rounded-full bg-[#3390ec] hover:bg-[#2b7fd4] transition-colors disabled:opacity-50"
                  >
                    {isUploadingMedia ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                  </button>
                ) : messageInput.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending}
                    className="p-1.5 sm:p-2 rounded-full bg-[#3390ec] hover:bg-[#2b7fd4] transition-colors disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                  </button>
                ) : (
                  <button className="p-1.5 sm:p-2 rounded-full hover:bg-[#232e3c] transition-colors">
                    <Mic className="w-5 h-5 text-[#6c7883]" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#0e1621] p-4">
            <div className="text-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#17212b] flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-[#3390ec]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-medium text-white mb-2">Select a chat to start messaging</h2>
              <p className="text-[#6c7883] text-sm sm:text-base">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};
