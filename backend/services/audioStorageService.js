// Audio Storage Service using MinIO (S3-compatible)
import { Client } from 'minio';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// MinIO Configuration
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000');
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const AUDIO_BUCKET = 'voice-audio';

// Initialize MinIO Client
const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
});

// Local storage fallback
const STORAGE_PATH = '/app/storage';
const LOCAL_AUDIO_PATH = path.join(STORAGE_PATH, 'audio');

// Ensure directories exist
if (!fs.existsSync(LOCAL_AUDIO_PATH)) {
  fs.mkdirSync(LOCAL_AUDIO_PATH, { recursive: true });
}

/**
 * Audio Storage Service
 * Supports both MinIO (S3) and local filesystem
 */
class AudioStorageService {
  constructor() {
    this.minioAvailable = false;
    this.initMinIO();
  }

  /**
   * Initialize MinIO and create bucket
   */
  async initMinIO() {
    try {
      // Check if bucket exists
      const exists = await minioClient.bucketExists(AUDIO_BUCKET);
      
      if (!exists) {
        await minioClient.makeBucket(AUDIO_BUCKET, 'us-east-1');
        console.log(`✅ MinIO bucket '${AUDIO_BUCKET}' created`);
      } else {
        console.log(`✅ MinIO connected - bucket '${AUDIO_BUCKET}' ready`);
      }
      
      this.minioAvailable = true;
    } catch (error) {
      console.log('⚠️ MinIO not available, using local storage fallback');
      this.minioAvailable = false;
    }
  }

  /**
   * Upload audio file
   * @param {Buffer|string} file - File buffer or path
   * @param {string} filename - Original filename
   * @param {string} userId - User ID for organization
   * @returns {Promise<string>} - Public URL or path
   */
  async uploadAudio(file, filename, userId = 'default') {
    const fileExt = path.extname(filename) || '.wav';
    const uniqueFilename = `${userId}/${uuidv4()}${fileExt}`;

    if (this.minioAvailable) {
      try {
        // Upload to MinIO
        const metadata = {
          'Content-Type': this.getContentType(fileExt),
          'X-User-Id': userId
        };

        if (Buffer.isBuffer(file)) {
          await minioClient.putObject(AUDIO_BUCKET, uniqueFilename, file, file.length, metadata);
        } else {
          await minioClient.fPutObject(AUDIO_BUCKET, uniqueFilename, file, metadata);
        }

        // Generate presigned URL (7 days expiry)
        const url = await minioClient.presignedGetObject(AUDIO_BUCKET, uniqueFilename, 7 * 24 * 60 * 60);
        
        console.log(`✅ Audio uploaded to MinIO: ${uniqueFilename}`);
        return {
          url,
          path: uniqueFilename,
          storage: 'minio'
        };
      } catch (error) {
        console.error('MinIO upload failed, falling back to local:', error);
        return this.uploadLocalAudio(file, uniqueFilename);
      }
    } else {
      return this.uploadLocalAudio(file, uniqueFilename);
    }
  }

  /**
   * Upload to local filesystem (fallback)
   */
  async uploadLocalAudio(file, filename) {
    const localPath = path.join(LOCAL_AUDIO_PATH, filename);
    const dir = path.dirname(localPath);

    // Create directory if needed
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (Buffer.isBuffer(file)) {
      fs.writeFileSync(localPath, file);
    } else if (typeof file === 'string') {
      fs.copyFileSync(file, localPath);
    }

    console.log(`✅ Audio saved locally: ${filename}`);
    return {
      url: `/storage/audio/${filename}`,
      path: localPath,
      storage: 'local'
    };
  }

  /**
   * Download audio file
   */
  async downloadAudio(filename) {
    if (this.minioAvailable) {
      try {
        const dataStream = await minioClient.getObject(AUDIO_BUCKET, filename);
        return dataStream;
      } catch (error) {
        console.error('MinIO download failed:', error);
      }
    }

    // Local fallback
    const localPath = path.join(LOCAL_AUDIO_PATH, filename);
    if (fs.existsSync(localPath)) {
      return fs.createReadStream(localPath);
    }

    throw new Error('Audio file not found');
  }

  /**
   * Delete audio file
   */
  async deleteAudio(filename) {
    if (this.minioAvailable) {
      try {
        await minioClient.removeObject(AUDIO_BUCKET, filename);
        console.log(`✅ Audio deleted from MinIO: ${filename}`);
        return true;
      } catch (error) {
        console.error('MinIO delete failed:', error);
      }
    }

    // Local fallback
    const localPath = path.join(LOCAL_AUDIO_PATH, filename);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`✅ Audio deleted locally: ${filename}`);
      return true;
    }

    return false;
  }

  /**
   * List user's audio files
   */
  async listUserAudio(userId) {
    const prefix = `${userId}/`;
    const files = [];

    if (this.minioAvailable) {
      try {
        const stream = minioClient.listObjects(AUDIO_BUCKET, prefix, true);
        
        for await (const obj of stream) {
          files.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified
          });
        }
      } catch (error) {
        console.error('MinIO list failed:', error);
      }
    }

    // Local fallback
    const userDir = path.join(LOCAL_AUDIO_PATH, userId);
    if (fs.existsSync(userDir)) {
      const localFiles = fs.readdirSync(userDir);
      localFiles.forEach(file => {
        const stats = fs.statSync(path.join(userDir, file));
        files.push({
          name: `${userId}/${file}`,
          size: stats.size,
          lastModified: stats.mtime
        });
      });
    }

    return files;
  }

  /**
   * Get content type from file extension
   */
  getContentType(ext) {
    const types = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.webm': 'audio/webm'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const stats = {
      storage_type: this.minioAvailable ? 'minio' : 'local',
      available: true
    };

    if (this.minioAvailable) {
      try {
        // Get bucket stats from MinIO
        stats.bucket = AUDIO_BUCKET;
        stats.endpoint = `${MINIO_ENDPOINT}:${MINIO_PORT}`;
      } catch (error) {
        stats.error = error.message;
      }
    } else {
      // Local storage stats
      stats.path = LOCAL_AUDIO_PATH;
      
      if (fs.existsSync(LOCAL_AUDIO_PATH)) {
        const files = fs.readdirSync(LOCAL_AUDIO_PATH, { recursive: true });
        stats.file_count = files.length;
      }
    }

    return stats;
  }
}

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /wav|mp3|ogg|flac|m4a|webm/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type. Allowed: wav, mp3, ogg, flac, m4a, webm'));
    }
  }
});

// Export singleton instance
const storageService = new AudioStorageService();

export { storageService, upload };
export default storageService;
