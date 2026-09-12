import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import config, { ensureDir } from '../config/index.js';

/**
 * Sprint 2 Phase 3: File Upload System with Multer
 * Handles image, video, and document uploads with validation
 */

// ------------------------------------------------------------
// Storage location
// ------------------------------------------------------------
// FIX: this used to be the hardcoded absolute path '/app/backend/uploads'
// and `fs.mkdirSync` ran at *import time*. On any machine that is not that
// exact container layout the call throws EACCES/ENOENT, and because the
// throw happens during module evaluation it took the entire Express app
// down before it could listen. Paths now come from the central config and
// directory creation is best-effort: if it fails we expose
// `uploadsAvailable === false` and uploads return a clean 503 instead of
// crashing the process.
const uploadsDir = config.paths.uploads;
const subdirs = config.paths.uploadSubdirs;

/** @type {string|null} null when the upload tree could not be created */
export const uploadsRoot = ensureDir(uploadsDir)
  ? subdirs.reduce((ok, dir) => (ensureDir(path.join(uploadsDir, dir)) ? ok : null), uploadsDir)
  : null;

export const uploadsAvailable = uploadsRoot !== null;

/** 503 guard applied to every upload route. */
export function requireUploads(req, res, next) {
  if (uploadsAvailable) return next();
  return res.status(503).json({
    error: 'Upload storage unavailable',
    message: `The server cannot write to its upload directory (${uploadsDir}).`,
    code: 'UPLOAD_STORAGE_UNAVAILABLE',
    timestamp: new Date().toISOString(),
  });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!uploadsAvailable) {
      return cb(new Error('Upload storage is not available on this server'));
    }
    // Determine subdirectory based on file type
    let subdir = 'documents';
    
    if (file.mimetype.startsWith('image/')) {
      subdir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subdir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subdir = 'audio';
    }
    
    const destination = path.join(uploadsDir, subdir);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  const allAllowedTypes = [
    ...allowedImageTypes,
    ...allowedVideoTypes,
    ...allowedAudioTypes,
    ...allowedDocTypes
  ];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Base multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10 // Max 10 files per request
  }
});

// Specific upload configurations
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
export const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 5 }
]);

// Image-only upload (smaller size limit)
export const uploadImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
    files: 5
  }
}).single('image');

// Video-only upload
export const uploadVideo = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB for videos
    files: 1
  }
}).single('video');

// Audio-only upload
export const uploadAudio = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for audio
    files: 1
  }
}).single('audio');

// Multer error handler middleware
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File exceeds maximum allowed size',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Number of files exceeds the limit',
        code: 'TOO_MANY_FILES'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Unexpected file field in request',
        code: 'UNEXPECTED_FILE_FIELD'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
      code: 'UPLOAD_ERROR'
    });
  }
  
  if (err) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
      code: 'UPLOAD_ERROR'
    });
  }
  
  next();
};

// Helper function to save file metadata to database
export async function saveFileMetadata(db, file, userId) {
  const metadata = {
    userId: userId,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    destination: file.destination,
    fileType: file.mimetype.split('/')[0], // image, video, audio, application
    createdAt: new Date()
  };
  
  const result = await db.collection('uploads').insertOne(metadata);
  return { ...metadata, _id: result.insertedId };
}

// Helper function to delete file from disk
export function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default {
  uploadsRoot,
  uploadsAvailable,
  requireUploads,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadImage,
  uploadVideo,
  uploadAudio,
  handleMulterError,
  saveFileMetadata,
  deleteFile
};
