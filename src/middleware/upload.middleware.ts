import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
const filesDir = path.join(uploadsDir, 'files');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Configure storage for images
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for images
const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
  }
};

// File filter for videos
const videoFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, MOV, and AVI are allowed.'));
  }
};

// Create multer instance for image uploads
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Create multer instance for video uploads
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for videos
  },
});

// Get image URL from filename
export const getImageUrl = (filename: string): string => {
  return `/uploads/images/${filename}`;
};

// Get video URL from filename
export const getVideoUrl = (filename: string): string => {
  return `/uploads/videos/${filename}`;
};

// Configure storage for files (documents)
const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, filesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);
    const filename = `${uuidv4()}_${safeName}${ext}`;
    cb(null, filename);
  },
});

// File filter for documents
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    // Other
    'application/json',
    'application/xml',
    'text/xml',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, true); // Allow all files for flexibility
  }
};

// Create multer instance for file uploads
export const uploadFile = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for files
  },
});

// Get file URL from filename
export const getFileUrl = (filename: string): string => {
  return `/uploads/files/${filename}`;
};
