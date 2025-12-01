// User Types
export interface User {
  id: string;
  phoneNumber: string;
  username?: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  createdAt: Date;
  lastSeen: Date;
  onlineStatus: OnlineStatus;
  publicKey?: string;
}

export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away'
}

export interface UserProfile {
  name: string;
  username?: string;
  profilePicture?: string;
  bio?: string;
}

// Authentication Types
export interface VerificationSession {
  id: string;
  phoneNumber: string;
  code: string;
  attemptsRemaining: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  iat?: number;
  exp?: number;
}

// Contact Types
export interface Contact {
  user: User;
  addedAt: Date;
}

export interface BlockedUser {
  userId: string;
  blockedUserId: string;
  blockedAt: Date;
}
