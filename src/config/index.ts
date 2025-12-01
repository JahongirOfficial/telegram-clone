import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram_clone',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!',
  },
  
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
