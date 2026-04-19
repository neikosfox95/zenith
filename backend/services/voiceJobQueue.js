// Background Job Queue Service using Bull + Redis
import Bull from 'bull';

// Redis Configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Queue Options
const queueOptions = {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200      // Keep last 200 failed jobs
  }
};

/**
 * Voice Processing Job Queue
 * Handles async voice cloning, conversion, and TTS jobs
 */
class VoiceJobQueue {
  constructor() {
    this.queues = {};
    this.isRedisAvailable = false;
    this.initQueues();
  }

  /**
   * Initialize all queues
   */
  async initQueues() {
    try {
      // Voice Cloning Queue
      this.queues.voiceCloning = new Bull('voice-cloning', queueOptions);
      
      // Voice Conversion Queue
      this.queues.voiceConversion = new Bull('voice-conversion', queueOptions);
      
      // TTS Generation Queue
      this.queues.ttsGeneration = new Bull('tts-generation', queueOptions);
      
      // Audio Processing Queue
      this.queues.audioProcessing = new Bull('audio-processing', queueOptions);

      // Setup processors
      this.setupProcessors();

      // Setup event listeners
      this.setupEventListeners();

      this.isRedisAvailable = true;
      console.log('✅ Bull job queues initialized with Redis');
    } catch (error) {
      console.log('⚠️ Redis not available, job queue disabled:', error.message);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Setup job processors
   */
  setupProcessors() {
    // Voice Cloning Processor
    this.queues.voiceCloning.process(async (job) => {
      console.log(`🎤 Processing voice cloning job: ${job.id}`);
      
      const { text, reference_audio_url, model, user_id } = job.data;
      
      // Update progress
      job.progress(10);
      
      // TODO: Call actual voice cloning service
      // For now, simulate processing
      await this.simulateProcessing(3000);
      job.progress(50);
      
      await this.simulateProcessing(2000);
      job.progress(90);
      
      // Return result
      return {
        job_id: job.id,
        audio_url: `/storage/audio/generated/${job.id}.wav`,
        duration: 5.2,
        model,
        status: 'completed'
      };
    });

    // Voice Conversion Processor
    this.queues.voiceConversion.process(async (job) => {
      console.log(`🔄 Processing voice conversion job: ${job.id}`);
      
      const { source_audio_url, target_voice_url, pitch_shift } = job.data;
      
      job.progress(20);
      await this.simulateProcessing(4000);
      job.progress(70);
      await this.simulateProcessing(2000);
      
      return {
        job_id: job.id,
        converted_audio_url: `/storage/audio/converted/${job.id}.wav`,
        pitch_shift,
        status: 'completed'
      };
    });

    // TTS Generation Processor
    this.queues.ttsGeneration.process(async (job) => {
      console.log(`🔊 Processing TTS generation job: ${job.id}`);
      
      const { text, voice_id, language } = job.data;
      
      job.progress(30);
      await this.simulateProcessing(2500);
      job.progress(80);
      
      return {
        job_id: job.id,
        audio_url: `/storage/audio/tts/${job.id}.wav`,
        text,
        voice_id,
        duration: text.length / 15,
        status: 'completed'
      };
    });

    // Audio Processing Processor
    this.queues.audioProcessing.process(async (job) => {
      console.log(`🎵 Processing audio job: ${job.id}`);
      
      const { operation, audio_url } = job.data;
      
      job.progress(40);
      await this.simulateProcessing(3000);
      
      return {
        job_id: job.id,
        processed_audio_url: `/storage/audio/processed/${job.id}.wav`,
        operation,
        status: 'completed'
      };
    });
  }

  /**
   * Setup event listeners for monitoring
   */
  setupEventListeners() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('completed', (job, result) => {
        console.log(`✅ ${name} job ${job.id} completed`);
      });

      queue.on('failed', (job, err) => {
        console.error(`❌ ${name} job ${job.id} failed:`, err.message);
      });

      queue.on('stalled', (job) => {
        console.warn(`⚠️ ${name} job ${job.id} stalled`);
      });

      queue.on('progress', (job, progress) => {
        console.log(`📊 ${name} job ${job.id} progress: ${progress}%`);
      });
    });
  }

  /**
   * Add voice cloning job
   */
  async addVoiceCloningJob(data, priority = 'normal') {
    if (!this.isRedisAvailable) {
      throw new Error('Job queue not available - Redis connection required');
    }

    const priorityMap = { high: 1, normal: 2, low: 3 };
    
    const job = await this.queues.voiceCloning.add(data, {
      priority: priorityMap[priority] || 2
    });

    return {
      job_id: job.id,
      status: 'queued',
      queue: 'voice-cloning',
      position: await job.getState()
    };
  }

  /**
   * Add voice conversion job
   */
  async addVoiceConversionJob(data, priority = 'normal') {
    if (!this.isRedisAvailable) {
      throw new Error('Job queue not available - Redis connection required');
    }

    const priorityMap = { high: 1, normal: 2, low: 3 };
    
    const job = await this.queues.voiceConversion.add(data, {
      priority: priorityMap[priority] || 2
    });

    return {
      job_id: job.id,
      status: 'queued',
      queue: 'voice-conversion'
    };
  }

  /**
   * Add TTS generation job
   */
  async addTTSGenerationJob(data, priority = 'normal') {
    if (!this.isRedisAvailable) {
      throw new Error('Job queue not available - Redis connection required');
    }

    const priorityMap = { high: 1, normal: 2, low: 3 };
    
    const job = await this.queues.ttsGeneration.add(data, {
      priority: priorityMap[priority] || 2
    });

    return {
      job_id: job.id,
      status: 'queued',
      queue: 'tts-generation'
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId, queueName = 'voiceCloning') {
    if (!this.isRedisAvailable) {
      return { error: 'Job queue not available' };
    }

    const queue = this.queues[queueName];
    if (!queue) {
      return { error: 'Queue not found' };
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return { error: 'Job not found' };
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return {
      job_id: jobId,
      state,
      progress,
      result,
      created_at: new Date(job.timestamp),
      processed_at: job.processedOn ? new Date(job.processedOn) : null,
      finished_at: job.finishedOn ? new Date(job.finishedOn) : null
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName = 'voiceCloning') {
    if (!this.isRedisAvailable) {
      return { error: 'Job queue not available' };
    }

    const queue = this.queues[queueName];
    if (!queue) {
      return { error: 'Queue not found' };
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllStats() {
    if (!this.isRedisAvailable) {
      return { error: 'Job queue not available', redis_available: false };
    }

    const stats = {};
    for (const queueName of Object.keys(this.queues)) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return {
      redis_available: true,
      queues: stats
    };
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId, queueName = 'voiceCloning') {
    if (!this.isRedisAvailable) {
      throw new Error('Job queue not available');
    }

    const queue = this.queues[queueName];
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    await job.retry();
    return { job_id: jobId, status: 'retrying' };
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId, queueName = 'voiceCloning') {
    if (!this.isRedisAvailable) {
      throw new Error('Job queue not available');
    }

    const queue = this.queues[queueName];
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();
    return { job_id: jobId, status: 'cancelled' };
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(olderThan = 24 * 60 * 60 * 1000) { // 24 hours default
    if (!this.isRedisAvailable) {
      return { error: 'Job queue not available' };
    }

    const results = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      const cleaned = await queue.clean(olderThan, 'completed');
      results[name] = cleaned.length;
    }

    return { cleaned: results };
  }

  /**
   * Simulate processing (for demo)
   */
  simulateProcessing(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close all queues
   */
  async close() {
    for (const queue of Object.values(this.queues)) {
      await queue.close();
    }
    console.log('✅ All job queues closed');
  }
}

// Export singleton instance
const voiceJobQueue = new VoiceJobQueue();

export { voiceJobQueue };
export default voiceJobQueue;
