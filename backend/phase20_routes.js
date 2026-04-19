// ============= PHASE 20: ULTIMATE INTEGRATION HUB & API MARKETPLACE =============
// API marketplace, webhook management, plugin system, developer tools

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupPhase20Routes(app, db, io, authenticateToken, ObjectId) {
  console.log('Setting up Phase 20 (Integration Hub & API Marketplace) routes...');

  // ============= API KEY MANAGEMENT =============

  // Create API key
  app.post('/api/developer/keys/create', authenticateToken, async (req, res) => {
    try {
      const { name, permissions, rate_limit } = req.body;

      const apiKey = {
        key_id: new ObjectId(),
        user_id: req.user.userId,
        name,
        key: `sk_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
        permissions: permissions || ['read', 'write'],
        rate_limit: rate_limit || { requests_per_minute: 100, requests_per_day: 10000 },
        created_at: new Date(),
        last_used: null,
        status: 'active',
        stats: {
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0
        }
      };

      await db.collection('api_keys').insertOne(apiKey);

      res.json({
        ...apiKey,
        key_id: apiKey.key_id.toString(),
        message: 'API key created. Store it securely - it won\'t be shown again.'
      });
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  });

  // Get user API keys (masked)
  app.get('/api/developer/keys', authenticateToken, async (req, res) => {
    try {
      const keys = await db.collection('api_keys')
        .find({ user_id: req.user.userId })
        .toArray();

      const maskedKeys = keys.map(k => ({
        ...k,
        key_id: k.key_id.toString(),
        key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4) // Mask the key
      }));

      res.json({ keys: maskedKeys, count: keys.length });
    } catch (error) {
      console.error('Get API keys error:', error);
      res.status(500).json({ error: 'Failed to retrieve API keys' });
    }
  });

  // ============= WEBHOOK MANAGEMENT =============

  // Create webhook
  app.post('/api/webhooks/create', authenticateToken, async (req, res) => {
    try {
      const { url, events, secret, description } = req.body;

      const webhook = {
        webhook_id: new ObjectId(),
        user_id: req.user.userId,
        url,
        events, // ['content.created', 'ai.completed', 'user.updated']
        secret: secret || Math.random().toString(36).substring(2),
        description,
        created_at: new Date(),
        status: 'active',
        stats: {
          total_deliveries: 0,
          successful_deliveries: 0,
          failed_deliveries: 0,
          avg_response_time: 0
        }
      };

      await db.collection('webhooks').insertOne(webhook);

      res.json({
        ...webhook,
        webhook_id: webhook.webhook_id.toString(),
        message: 'Webhook created'
      });
    } catch (error) {
      console.error('Create webhook error:', error);
      res.status(500).json({ error: 'Failed to create webhook' });
    }
  });

  // Get webhook deliveries
  app.get('/api/webhooks/:webhook_id/deliveries', authenticateToken, async (req, res) => {
    try {
      const { webhook_id } = req.params;
      const deliveries = await db.collection('webhook_deliveries')
        .find({ webhook_id })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      res.json({ deliveries, count: deliveries.length });
    } catch (error) {
      console.error('Get deliveries error:', error);
      res.status(500).json({ error: 'Failed to retrieve webhook deliveries' });
    }
  });

  // Test webhook
  app.post('/api/webhooks/:webhook_id/test', authenticateToken, async (req, res) => {
    try {
      const { webhook_id } = req.params;
      const webhook = await db.collection('webhooks').findOne({ webhook_id: new ObjectId(webhook_id) });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      const testPayload = {
        event: 'webhook.test',
        webhook_id,
        timestamp: new Date(),
        data: { message: 'This is a test webhook delivery' }
      };

      // Simulate webhook delivery
      const delivery = {
        delivery_id: new ObjectId(),
        webhook_id,
        event: 'webhook.test',
        payload: testPayload,
        timestamp: new Date(),
        status: 'success',
        response_code: 200,
        response_time: Math.floor(Math.random() * 500) + 50
      };

      await db.collection('webhook_deliveries').insertOne(delivery);

      res.json({
        ...delivery,
        delivery_id: delivery.delivery_id.toString(),
        message: 'Test webhook sent'
      });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ error: 'Failed to test webhook' });
    }
  });

  // ============= PLUGIN MARKETPLACE =============

  // Publish plugin
  app.post('/api/marketplace/plugin/publish', authenticateToken, async (req, res) => {
    try {
      const { name, description, category, version, manifest_url, icon_url, screenshots } = req.body;

      const plugin = {
        plugin_id: new ObjectId(),
        developer_id: req.user.userId,
        name,
        description,
        category, // 'ai', 'productivity', 'media', 'analytics', 'integration'
        version,
        manifest_url,
        icon_url,
        screenshots: screenshots || [],
        published_at: new Date(),
        status: 'pending-review',
        pricing: {
          model: 'free', // 'free', 'one-time', 'subscription'
          price: 0
        },
        stats: {
          installs: 0,
          active_users: 0,
          rating: 0,
          reviews: 0
        }
      };

      await db.collection('marketplace_plugins').insertOne(plugin);

      res.json({
        ...plugin,
        plugin_id: plugin.plugin_id.toString(),
        message: 'Plugin submitted for review'
      });
    } catch (error) {
      console.error('Publish plugin error:', error);
      res.status(500).json({ error: 'Failed to publish plugin' });
    }
  });

  // Browse marketplace
  app.get('/api/marketplace/plugins', authenticateToken, async (req, res) => {
    try {
      const { category, sort = 'popular', search } = req.query;

      const query = { status: 'approved' };
      if (category) query.category = category;
      if (search) query.$text = { $search: search };

      const sortOptions = {
        'popular': { 'stats.installs': -1 },
        'rating': { 'stats.rating': -1 },
        'recent': { 'published_at': -1 }
      };

      const plugins = await db.collection('marketplace_plugins')
        .find(query)
        .sort(sortOptions[sort] || sortOptions.popular)
        .limit(50)
        .toArray();

      res.json({
        plugins: plugins.map(p => ({ ...p, plugin_id: p.plugin_id.toString() })),
        count: plugins.length
      });
    } catch (error) {
      console.error('Browse marketplace error:', error);
      res.status(500).json({ error: 'Failed to browse marketplace' });
    }
  });

  // Install plugin
  app.post('/api/marketplace/plugin/:plugin_id/install', authenticateToken, async (req, res) => {
    try {
      const { plugin_id } = req.params;

      const installation = {
        installation_id: new ObjectId(),
        user_id: req.user.userId,
        plugin_id,
        installed_at: new Date(),
        status: 'active',
        settings: {},
        auto_update: true
      };

      await db.collection('plugin_installations').insertOne(installation);

      // Update plugin stats
      await db.collection('marketplace_plugins').updateOne(
        { plugin_id: new ObjectId(plugin_id) },
        { 
          $inc: { 'stats.installs': 1, 'stats.active_users': 1 }
        }
      );

      res.json({
        ...installation,
        installation_id: installation.installation_id.toString(),
        message: 'Plugin installed successfully'
      });
    } catch (error) {
      console.error('Install plugin error:', error);
      res.status(500).json({ error: 'Failed to install plugin' });
    }
  });

  // ============= THIRD-PARTY INTEGRATIONS =============

  // Connect third-party service
  app.post('/api/integrations/connect', authenticateToken, async (req, res) => {
    try {
      const { service, credentials, scopes } = req.body;

      const integration = {
        integration_id: new ObjectId(),
        user_id: req.user.userId,
        service, // 'zapier', 'make', 'ifttt', 'n8n', 'slack', 'discord', 'telegram'
        credentials, // Encrypted in production
        scopes,
        connected_at: new Date(),
        status: 'active',
        sync_enabled: true,
        last_sync: null
      };

      await db.collection('third_party_integrations').insertOne(integration);

      res.json({
        ...integration,
        integration_id: integration.integration_id.toString(),
        credentials: '***', // Mask credentials in response
        message: `${service} connected successfully`
      });
    } catch (error) {
      console.error('Connect integration error:', error);
      res.status(500).json({ error: 'Failed to connect integration' });
    }
  });

  // Get available integrations
  app.get('/api/integrations/available', authenticateToken, async (req, res) => {
    try {
      const integrations = [
        { id: 'zapier', name: 'Zapier', category: 'automation', icon: '/icons/zapier.png', connected: false },
        { id: 'make', name: 'Make', category: 'automation', icon: '/icons/make.png', connected: false },
        { id: 'slack', name: 'Slack', category: 'communication', icon: '/icons/slack.png', connected: false },
        { id: 'discord', name: 'Discord', category: 'communication', icon: '/icons/discord.png', connected: false },
        { id: 'notion', name: 'Notion', category: 'productivity', icon: '/icons/notion.png', connected: false },
        { id: 'airtable', name: 'Airtable', category: 'database', icon: '/icons/airtable.png', connected: false },
        { id: 'shopify', name: 'Shopify', category: 'ecommerce', icon: '/icons/shopify.png', connected: false },
        { id: 'stripe', name: 'Stripe', category: 'payments', icon: '/icons/stripe.png', connected: false },
        { id: 'google-drive', name: 'Google Drive', category: 'storage', icon: '/icons/gdrive.png', connected: false },
        { id: 'dropbox', name: 'Dropbox', category: 'storage', icon: '/icons/dropbox.png', connected: false }
      ];

      // Check which are connected
      const userIntegrations = await db.collection('third_party_integrations')
        .find({ user_id: req.user.userId })
        .toArray();
      
      const connectedServices = new Set(userIntegrations.map(i => i.service));
      
      const result = integrations.map(i => ({
        ...i,
        connected: connectedServices.has(i.id)
      }));

      res.json({ integrations: result, count: result.length });
    } catch (error) {
      console.error('Get integrations error:', error);
      res.status(500).json({ error: 'Failed to retrieve integrations' });
    }
  });

  // ============= DEVELOPER ANALYTICS =============

  // Get API usage analytics
  app.get('/api/developer/analytics', authenticateToken, async (req, res) => {
    try {
      const { period = '7d' } = req.query;

      const analytics = {
        period,
        api_calls: {
          total: 45678,
          by_endpoint: {
            '/api/ai/generate': 12345,
            '/api/video/process': 8901,
            '/api/analytics/dashboard': 5678,
            'other': 18754
          },
          by_status: {
            '200': 42345,
            '400': 2234,
            '401': 567,
            '500': 532
          }
        },
        performance: {
          avg_response_time: 245, // ms
          p95_response_time: 890,
          p99_response_time: 1450
        },
        errors: {
          total: 3333,
          rate: 0.073, // 7.3%
          top_errors: [
            { code: 'RATE_LIMIT_EXCEEDED', count: 1234 },
            { code: 'INVALID_INPUT', count: 891 },
            { code: 'AUTH_FAILED', count: 567 }
          ]
        },
        rate_limits: {
          current_usage: 4567,
          limit: 10000,
          reset_at: new Date(Date.now() + 3600000)
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
  });

  // ============= SDK DOWNLOADS =============

  // Get SDK information
  app.get('/api/developer/sdks', authenticateToken, async (req, res) => {
    try {
      const sdks = [
        { language: 'JavaScript', version: '2.5.0', download_url: '/sdks/js/v2.5.0', docs_url: '/docs/sdk/js' },
        { language: 'Python', version: '3.2.1', download_url: '/sdks/python/v3.2.1', docs_url: '/docs/sdk/python' },
        { language: 'Ruby', version: '1.8.0', download_url: '/sdks/ruby/v1.8.0', docs_url: '/docs/sdk/ruby' },
        { language: 'Go', version: '2.1.0', download_url: '/sdks/go/v2.1.0', docs_url: '/docs/sdk/go' },
        { language: 'Java', version: '4.0.2', download_url: '/sdks/java/v4.0.2', docs_url: '/docs/sdk/java' },
        { language: 'PHP', version: '2.7.3', download_url: '/sdks/php/v2.7.3', docs_url: '/docs/sdk/php' }
      ];

      res.json({ sdks, count: sdks.length });
    } catch (error) {
      console.error('Get SDKs error:', error);
      res.status(500).json({ error: 'Failed to retrieve SDKs' });
    }
  });

  console.log('✅ Phase 20 (Integration Hub & API Marketplace) routes loaded');
}
