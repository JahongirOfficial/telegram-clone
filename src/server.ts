import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { connectDB } from './database/connection';
import { initializeSocket } from './socket/socket.service';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Initialize Socket.io
  initializeSocket(httpServer);
  console.log('� S ocket.io initialized');

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Client URL: ${config.clientUrl}`);
  });
};

startServer().catch(console.error);

export { app, httpServer };
