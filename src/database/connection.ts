import mongoose from 'mongoose';
import { config } from '../config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('📦 MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

export const closeDB = async (): Promise<void> => {
  await mongoose.connection.close();
};
