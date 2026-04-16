// ============= PHASE 5: ENTERPRISE & SCALABILITY FEATURES =============

import Redis from 'ioredis';
import Bull from 'bull';

// Redis client for caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    return null; // Disable retry if Redis not available
  }
});

redis.on('error', () => {
  console.log('Redis not available, running without cache');
});

// Job queue for background tasks
const jobQueue = new Bull('background-jobs', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
});

export function setupPhase5Routes(app, db, io, authenticateToken, ObjectId) {

// ============= CACHING SYSTEM =============

// Cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    if (!redis.status || redis.status !== 'ready') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = (body) => {
        redis.setex(key, duration, JSON.stringify(body));
        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

// Clear cache API
app.post('/api/cache/clear', authenticateToken, async (req, res) => {
  try {
    const { pattern = '*' } = req.body;
    
    if (redis.status === 'ready') {
      const keys = await redis.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      res.json({ message: 'Cache cleared', keys_deleted: keys.length });
    } else {
      res.json({ message: 'Redis not available' });
    }
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ============= MULTI-LANGUAGE SUPPORT (i18n) =============

const translations = {
  en: {
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    creators: 'Creators',
    analytics: 'Analytics',
    settings: 'Settings'
  },
  es: {
    welcome: 'Bienvenido',
    dashboard: 'Panel',
    creators: 'Creadores',
    analytics: 'Analíticas',
    settings: 'Configuración'
  },
  fr: {
    welcome: 'Bienvenue',
    dashboard: 'Tableau de bord',
    creators: 'Créateurs',
    analytics: 'Analytique',
    settings: 'Paramètres'
  },
  de: {
    welcome: 'Willkommen',
    dashboard: 'Übersicht',
    creators: 'Ersteller',
    analytics: 'Analytik',
    settings: 'Einstellungen'
  },
  ja: {
    welcome: 'ようこそ',
    dashboard: 'ダッシュボード',
    creators: 'クリエイター',
    analytics: '分析',
    settings: '設定'
  },
  zh: {
    welcome: '欢迎',
    dashboard: '仪表板',
    creators: '创作者',
    analytics: '分析',
    settings: '设置'
  }
};

// Get translations
app.get('/api/i18n/:lang', cache(3600), (req, res) => {
  const { lang } = req.params;
  res.json(translations[lang] || translations.en);
});

// Get supported languages
app.get('/api/i18n/languages', (req, res) => {
  res.json({
    supported: Object.keys(translations),
    default: 'en'
  });
});

// ============= WHITE-LABEL CUSTOMIZATION =============

// Get branding settings
app.get('/api/branding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const branding = await db.collection('branding').findOne({
      user_id: new ObjectId(userId)
    }) || {
      logo_url: null,
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      app_name: 'TikTok Live Monitor',
      custom_domain: null
    };

    res.json(branding);
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({ error: 'Failed to get branding' });
  }
});

// Update branding
app.put('/api/branding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const branding = req.body;

    await db.collection('branding').updateOne(
      { user_id: new ObjectId(userId) },
      { $set: { ...branding, updated_at: new Date() } },
      { upsert: true }
    );

    res.json({ message: 'Branding updated' });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

// ============= API RATE LIMITING =============

const rateLimits = new Map();

function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.user ? req.user.id : req.ip;
    const now = Date.now();
    
    if (!rateLimits.has(key)) {
      rateLimits.set(key, []);
    }

    const requests = rateLimits.get(key).filter(time => now - time < windowMs);
    requests.push(now);
    rateLimits.set(key, requests);

    if (requests.length > maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - requests.length);
    next();
  };
}

// ============= BACKGROUND JOB PROCESSING =============

// Add job to queue
jobQueue.process('generate-report', async (job) => {
  const { creatorId, reportType, startDate, endDate } = job.data;
  // Report generation logic here
  console.log(`Processing report for creator ${creatorId}`);
  return { status: 'completed' };
});

// Create background job API
app.post('/api/jobs/create', authenticateToken, async (req, res) => {
  try {
    const { jobType, data } = req.body;

    const job = await jobQueue.add(jobType, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    res.json({
      job_id: job.id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Get job status
app.get('/api/jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await jobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    
    res.json({
      job_id: job.id,
      status: state,
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// ============= ADVANCED API FEATURES =============

// API key management
app.post('/api/api-keys/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions = [] } = req.body;

    const apiKey = {
      user_id: new ObjectId(userId),
      name,
      key: `sk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      permissions,
      active: true,
      created_at: new Date(),
      last_used: null,
      usage_count: 0
    };

    const result = await db.collection('api_keys').insertOne(apiKey);

    res.json({
      api_key: apiKey.key,
      name: apiKey.name,
      id: result.insertedId
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// List API keys
app.get('/api/api-keys', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const keys = await db.collection('api_keys')
      .find({ user_id: new ObjectId(userId) })
      .project({ key: 0 }) // Don't expose actual keys
      .toArray();

    res.json(keys);
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

// Revoke API key
app.delete('/api/api-keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const { keyId } = req.params;

    await db.collection('api_keys').updateOne(
      { _id: new ObjectId(keyId) },
      { $set: { active: false, revoked_at: new Date() } }
    );

    res.json({ message: 'API key revoked' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// ============= DATA RETENTION & COMPLIANCE =============

// GDPR data export
app.get('/api/compliance/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = {
      user: await db.collection('users').findOne({ _id: new ObjectId(userId) }),
      creators: await db.collection('user_creators').find({ user_id: new ObjectId(userId) }).toArray(),
      notifications: await db.collection('notifications').find({ user_id: new ObjectId(userId) }).toArray(),
      saved_queries: await db.collection('saved_queries').find({ user_id: new ObjectId(userId) }).toArray(),
      team_invites: await db.collection('team_invites').find({ inviter_id: new ObjectId(userId) }).toArray()
    };

    res.json(userData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete user data (GDPR right to be forgotten)
app.delete('/api/compliance/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirm } = req.body;

    if (confirm !== 'DELETE') {
      return res.status(400).json({ error: 'Please confirm deletion' });
    }

    // Delete all user data
    await Promise.all([
      db.collection('users').deleteOne({ _id: new ObjectId(userId) }),
      db.collection('user_creators').deleteMany({ user_id: new ObjectId(userId) }),
      db.collection('notifications').deleteMany({ user_id: new ObjectId(userId) }),
      db.collection('saved_queries').deleteMany({ user_id: new ObjectId(userId) }),
      db.collection('team_invites').deleteMany({ inviter_id: new ObjectId(userId) }),
      db.collection('webhooks').deleteMany({ user_id: new ObjectId(userId) }),
      db.collection('alert_rules').deleteMany({ user_id: new ObjectId(userId) })
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============= SYSTEM HEALTH & MONITORING =============

// System health check
app.get('/api/system/health', async (req, res) => {
  const health = {
    status: 'operational',
    timestamp: new Date(),
    services: {
      database: 'operational',
      redis: redis.status === 'ready' ? 'operational' : 'unavailable',
      queue: 'operational'
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  // Check database
  try {
    await db.admin().ping();
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  res.json(health);
});

// System metrics
app.get('/api/system/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = {
      total_users: await db.collection('users').countDocuments(),
      total_creators: await db.collection('creators').countDocuments(),
      total_streams: await db.collection('live_streams').countDocuments(),
      active_streams: await db.collection('live_streams').countDocuments({ status: 'live' }),
      total_gifts: await db.collection('gifts').countDocuments(),
      total_revenue: (await db.collection('gifts').aggregate([
        { $group: { _id: null, total: { $sum: '$total_value' } } }
      ]).toArray())[0]?.total || 0
    };

    res.json(metrics);
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// ============= CUSTOM INTEGRATIONS =============

// Integration marketplace
app.get('/api/integrations/marketplace', cache(3600), (req, res) => {
  const integrations = [
    {
      id: 'discord',
      name: 'Discord',
      description: 'Send notifications to Discord channels',
      category: 'notifications',
      icon: 'discord-icon.png',
      popular: true
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Integrate with Slack workspaces',
      category: 'notifications',
      icon: 'slack-icon.png',
      popular: true
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Export data to Google Sheets',
      category: 'export',
      icon: 'sheets-icon.png',
      popular: false
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 1000+ apps',
      category: 'automation',
      icon: 'zapier-icon.png',
      popular: true
    }
  ];

  res.json(integrations);
});

// Connect integration
app.post('/api/integrations/connect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { integration_id, config } = req.body;

    const integration = {
      user_id: new ObjectId(userId),
      integration_id,
      config,
      active: true,
      connected_at: new Date()
    };

    const result = await db.collection('integrations').insertOne(integration);

    res.json({ ...integration, _id: result.insertedId });
  } catch (error) {
    console.error('Connect integration error:', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
});

// ============= ADVANCED EXPORT FORMATS =============

// Export to Excel
app.post('/api/export/excel', authenticateToken, async (req, res) => {
  try {
    const { collection, query } = req.body;
    
    // This would use a library like exceljs in production
    res.json({ message: 'Excel export coming soon', format: 'xlsx' });
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// Export to PDF
app.post('/api/export/pdf', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.body;
    
    // This would use a library like puppeteer/pdfkit in production
    res.json({ message: 'PDF export coming soon', format: 'pdf' });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export to PDF' });
  }
});

console.log('✅ Phase 5 (Enterprise & Scale) routes loaded');

}
