// ============= PHASE 15: ENTERPRISE ADMIN & TEAM MANAGEMENT =============
// Advanced admin controls, team management, organization settings

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupPhase15Routes(app, db, io, authenticateToken, ObjectId) {
  console.log('Setting up Phase 15 (Enterprise Admin) routes...');

  // ============= ORGANIZATION MANAGEMENT =============

  // Create organization
  app.post('/api/org/create', authenticateToken, async (req, res) => {
    try {
      const { name, description, industry, size } = req.body;

      const organization = {
        org_id: new ObjectId(),
        owner_id: req.user.userId,
        name,
        description,
        industry,
        size, // 'startup', 'small', 'medium', 'enterprise'
        created_at: new Date(),
        plan: 'enterprise',
        members: [
          { user_id: req.user.userId, role: 'owner', added_at: new Date() }
        ],
        settings: {
          branding: { logo: null, colors: {}, custom_domain: null },
          security: {
            sso_enabled: true,
            mfa_required: true,
            ip_whitelist: [],
            session_timeout: 3600
          },
          billing: {
            plan: 'enterprise',
            seats: 100,
            billing_email: null
          }
        },
        stats: {
          total_members: 1,
          total_projects: 0,
          storage_used: 0
        }
      };

      await db.collection('organizations').insertOne(organization);

      res.json({
        ...organization,
        org_id: organization.org_id.toString(),
        message: 'Organization created successfully'
      });
    } catch (error) {
      console.error('Create org error:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  // Get organization details
  app.get('/api/org/:org_id', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const org = await db.collection('organizations').findOne({ org_id: new ObjectId(org_id) });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json({ ...org, org_id: org.org_id.toString() });
    } catch (error) {
      console.error('Get org error:', error);
      res.status(500).json({ error: 'Failed to retrieve organization' });
    }
  });

  // ============= TEAM MANAGEMENT =============

  // Add team member
  app.post('/api/org/:org_id/members/add', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const { email, role, permissions = [] } = req.body;

      const member = {
        member_id: new ObjectId(),
        email,
        role, // 'admin', 'manager', 'member', 'viewer'
        permissions,
        added_by: req.user.userId,
        added_at: new Date(),
        status: 'pending',
        invite_token: Math.random().toString(36).substring(7)
      };

      await db.collection('organizations').updateOne(
        { org_id: new ObjectId(org_id) },
        { $push: { members: member } }
      );

      // Send invitation email (simulate)
      io.emit('org:member-invited', { org_id, email });

      res.json({
        ...member,
        member_id: member.member_id.toString(),
        invite_url: `/invite/${member.invite_token}`,
        message: 'Member invited successfully'
      });
    } catch (error) {
      console.error('Add member error:', error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  });

  // Get organization members
  app.get('/api/org/:org_id/members', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const org = await db.collection('organizations').findOne({ org_id: new ObjectId(org_id) });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json({
        members: org.members,
        count: org.members.length
      });
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({ error: 'Failed to retrieve members' });
    }
  });

  // Update member role/permissions
  app.put('/api/org/:org_id/members/:member_id', authenticateToken, async (req, res) => {
    try {
      const { org_id, member_id } = req.params;
      const { role, permissions } = req.body;

      await db.collection('organizations').updateOne(
        { org_id: new ObjectId(org_id), 'members.member_id': new ObjectId(member_id) },
        { 
          $set: { 
            'members.$.role': role,
            'members.$.permissions': permissions,
            'members.$.updated_at': new Date()
          }
        }
      );

      res.json({ success: true, message: 'Member updated successfully' });
    } catch (error) {
      console.error('Update member error:', error);
      res.status(500).json({ error: 'Failed to update member' });
    }
  });

  // ============= ROLE-BASED ACCESS CONTROL (RBAC) =============

  // Create custom role
  app.post('/api/org/:org_id/roles/create', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const { name, description, permissions } = req.body;

      const role = {
        role_id: new ObjectId(),
        org_id,
        name,
        description,
        permissions, // Array of permission strings
        created_at: new Date(),
        created_by: req.user.userId
      };

      await db.collection('custom_roles').insertOne(role);

      res.json({
        ...role,
        role_id: role.role_id.toString(),
        message: 'Custom role created successfully'
      });
    } catch (error) {
      console.error('Create role error:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  });

  // Get organization roles
  app.get('/api/org/:org_id/roles', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const roles = await db.collection('custom_roles').find({ org_id }).toArray();

      // Include default roles
      const defaultRoles = [
        { role_id: 'owner', name: 'Owner', permissions: ['*'] },
        { role_id: 'admin', name: 'Admin', permissions: ['manage_members', 'manage_projects', 'view_analytics'] },
        { role_id: 'member', name: 'Member', permissions: ['create_content', 'view_own_data'] },
        { role_id: 'viewer', name: 'Viewer', permissions: ['view_content'] }
      ];

      res.json({
        roles: [...defaultRoles, ...roles.map(r => ({ ...r, role_id: r.role_id.toString() }))],
        count: defaultRoles.length + roles.length
      });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to retrieve roles' });
    }
  });

  // ============= AUDIT LOGS =============

  // Get audit logs
  app.get('/api/org/:org_id/audit-logs', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const { start_date, end_date, user_id, action_type } = req.query;

      const query = { org_id };
      if (user_id) query.user_id = user_id;
      if (action_type) query.action_type = action_type;
      if (start_date || end_date) {
        query.timestamp = {};
        if (start_date) query.timestamp.$gte = new Date(start_date);
        if (end_date) query.timestamp.$lte = new Date(end_date);
      }

      const logs = await db.collection('audit_logs')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      res.json({
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  });

  // ============= USAGE ANALYTICS =============

  // Get organization usage stats
  app.get('/api/org/:org_id/usage', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const { period = '30d' } = req.query;

      const usage = {
        org_id,
        period,
        api_calls: {
          total: 125000,
          by_service: {
            'ai-generation': 45000,
            'video-processing': 35000,
            'analytics': 25000,
            'storage': 20000
          }
        },
        storage: {
          total_gb: 245.8,
          by_type: {
            'videos': 180.2,
            'images': 40.5,
            'audio': 15.3,
            'documents': 9.8
          }
        },
        users: {
          total_active: 45,
          daily_average: 32,
          peak_concurrent: 18
        },
        costs: {
          total: 1245.50,
          by_service: {
            'ai-generation': 450.00,
            'video-processing': 380.25,
            'storage': 215.25,
            'analytics': 200.00
          }
        }
      };

      res.json(usage);
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage data' });
    }
  });

  // ============= BILLING & SUBSCRIPTIONS =============

  // Get billing information
  app.get('/api/org/:org_id/billing', authenticateToken, async (req, res) => {
    try {
      const { org_id } = req.params;
      const org = await db.collection('organizations').findOne({ org_id: new ObjectId(org_id) });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const billing = {
        current_plan: org.settings.billing.plan,
        seats: org.settings.billing.seats,
        next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount: 2499.00,
        payment_method: {
          type: 'card',
          last4: '4242',
          expiry: '12/26'
        },
        invoices: [
          { invoice_id: 'INV-001', date: '2025-05-01', amount: 2499.00, status: 'paid' },
          { invoice_id: 'INV-002', date: '2025-04-01', amount: 2499.00, status: 'paid' }
        ]
      };

      res.json(billing);
    } catch (error) {
      console.error('Get billing error:', error);
      res.status(500).json({ error: 'Failed to retrieve billing information' });
    }
  });

  console.log('✅ Phase 15 (Enterprise Admin) routes loaded');
}
