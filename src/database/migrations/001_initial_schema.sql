-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  name VARCHAR(100) NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  online_status VARCHAR(20) DEFAULT 'offline',
  public_key TEXT,
  encrypted_private_key TEXT
);

-- Verification sessions table
CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts_remaining INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, contact_id)
);

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, blocked_user_id)
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  description TEXT,
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  encrypted_content TEXT,
  type VARCHAR(20) DEFAULT 'text',
  media_id UUID,
  reply_to_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  is_edited BOOLEAN DEFAULT FALSE
);

-- Message delivery status table
CREATE TABLE IF NOT EXISTS message_delivery (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id)
);

-- Message read status table
CREATE TABLE IF NOT EXISTS message_read (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id)
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device tokens for notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, token)
);

-- Muted chats table
CREATE TABLE IF NOT EXISTS muted_chats (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  muted_until TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, chat_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_expires ON verification_sessions(expires_at);
