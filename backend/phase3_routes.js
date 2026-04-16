// ============= PHASE 3+ ROUTES: NOTIFICATIONS, WEBHOOKS, EXPORT, COLLABORATION =============

export function setupPhase3Routes(app, db, io, authenticateToken, sendEmailNotification, sendPushNotification, triggerWebhook, checkAlertRules, exportToCSV, generateReport, backupData, logAuditEvent, hasPermission, ObjectId) {

// ============= NOTIFICATION ROUTES =============

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, unread_only } = req.query;

    const query = { user_id: new ObjectId(userId) };
    if (unread_only === 'true') {
      query.read = false;
    }

    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .toArray();

    const unreadCount = await db.collection('notifications')
      .countDocuments({ user_id: new ObjectId(userId), read: false });

    res.json({ notifications, unread_count: unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true, read_at: new Date() } }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.collection('notifications').updateMany(
      { user_id: new ObjectId(userId), read: false },
      { $set: { read: true, read_at: new Date() } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    await db.collection('notifications').deleteOne({
      _id: new ObjectId(notificationId)
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ============= WEBHOOK ROUTES =============

// Create webhook
app.post('/api/webhooks', authenticateToken, async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    const userId = req.user.id;

    const webhook = {
      user_id: new ObjectId(userId),
      url,
      events: events || ['*'],
      secret: secret || Math.random().toString(36).substring(2),
      active: true,
      created_at: new Date()
    };

    const result = await db.collection('webhooks').insertOne(webhook);

    res.json({ ...webhook, _id: result.insertedId });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Get webhooks
app.get('/api/webhooks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const webhooks = await db.collection('webhooks')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    res.json(webhooks);
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
});

// Update webhook
app.put('/api/webhooks/:webhookId', authenticateToken, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { url, events, active } = req.body;

    await db.collection('webhooks').updateOne(
      { _id: new ObjectId(webhookId) },
      { $set: { url, events, active, updated_at: new Date() } }
    );

    res.json({ message: 'Webhook updated' });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
app.delete('/api/webhooks/:webhookId', authenticateToken, async (req, res) => {
  try {
    const { webhookId } = req.params;

    await db.collection('webhooks').deleteOne({
      _id: new ObjectId(webhookId)
    });

    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Get webhook logs
app.get('/api/webhooks/:webhookId/logs', authenticateToken, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await db.collection('webhook_logs')
      .find({ webhook_id: new ObjectId(webhookId) })
      .sort({ delivered_at: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(logs);
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ error: 'Failed to get webhook logs' });
  }
});

// ============= ALERT RULES ROUTES =============

// Create alert rule
app.post('/api/alert-rules', authenticateToken, async (req, res) => {
  try {
    const { name, metric, condition, threshold, creatorId } = req.body;
    const userId = req.user.id;

    const rule = {
      user_id: new ObjectId(userId),
      creator_id: new ObjectId(creatorId),
      name,
      metric,
      condition,
      threshold,
      active: true,
      created_at: new Date()
    };

    const result = await db.collection('alert_rules').insertOne(rule);

    res.json({ ...rule, _id: result.insertedId });
  } catch (error) {
    console.error('Create alert rule error:', error);
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

// Get alert rules
app.get('/api/alert-rules', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const rules = await db.collection('alert_rules')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    res.json(rules);
  } catch (error) {
    console.error('Get alert rules error:', error);
    res.status(500).json({ error: 'Failed to get alert rules' });
  }
});

// Update alert rule
app.put('/api/alert-rules/:ruleId', authenticateToken, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    await db.collection('alert_rules').updateOne(
      { _id: new ObjectId(ruleId) },
      { $set: { ...updates, updated_at: new Date() } }
    );

    res.json({ message: 'Alert rule updated' });
  } catch (error) {
    console.error('Update alert rule error:', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

// Delete alert rule
app.delete('/api/alert-rules/:ruleId', authenticateToken, async (req, res) => {
  try {
    const { ruleId } = req.params;

    await db.collection('alert_rules').deleteOne({
      _id: new ObjectId(ruleId)
    });

    res.json({ message: 'Alert rule deleted' });
  } catch (error) {
    console.error('Delete alert rule error:', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

// Get alert history
app.get('/api/alert-history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const history = await db.collection('alert_history')
      .find()
      .sort({ triggered_at: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(history);
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({ error: 'Failed to get alert history' });
  }
});

// ============= EXPORT & REPORTING ROUTES =============

// Export data
app.post('/api/export', authenticateToken, async (req, res) => {
  try {
    const { collection, query, fields, format } = req.body;

    if (format === 'csv') {
      const filename = `export_${Date.now()}.csv`;
      const filepath = await exportToCSV(collection, query, fields, filename);

      if (filepath) {
        res.download(filepath);
      } else {
        res.status(500).json({ error: 'Export failed' });
      }
    } else {
      // JSON export
      const data = await db.collection(collection).find(query).toArray();
      res.json(data);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Generate report
app.post('/api/reports/generate', authenticateToken, async (req, res) => {
  try {
    const { creatorId, startDate, endDate, reportType } = req.body;

    const report = await generateReport(creatorId, startDate, endDate, reportType);

    if (report) {
      res.json(report);
    } else {
      res.status(500).json({ error: 'Report generation failed' });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get reports
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const reports = await db.collection('reports')
      .find()
      .sort({ generated_at: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Download report
app.get('/api/reports/:reportId/download', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await db.collection('reports').findOne({
      _id: new ObjectId(reportId)
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// ============= BACKUP & RESTORE ROUTES =============

// Create backup
app.post('/api/backup/create', authenticateToken, async (req, res) => {
  try {
    const backupFile = await backupData();

    if (backupFile) {
      res.json({ 
        message: 'Backup created successfully',
        file: backupFile
      });
    } else {
      res.status(500).json({ error: 'Backup failed' });
    }
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// ============= TEAM COLLABORATION ROUTES =============

// Invite team member
app.post('/api/team/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role } = req.body;
    const userId = req.user.id;

    const invite = {
      inviter_id: new ObjectId(userId),
      email,
      role,
      token: Math.random().toString(36).substring(2),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false,
      created_at: new Date()
    };

    const result = await db.collection('team_invites').insertOne(invite);

    // Send invite email
    await sendEmailNotification(
      email,
      'Team Invite - TikTok Live Monitor',
      `You've been invited to join a team. <a href="https://app.tiktokmonitor.com/invite/${invite.token}">Accept invite</a>`
    );

    res.json({ ...invite, _id: result.insertedId });
  } catch (error) {
    console.error('Invite team member error:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// Get team members
app.get('/api/team/members', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const members = await db.collection('team_members')
      .find({ team_owner: new ObjectId(userId) })
      .toArray();

    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Remove team member
app.delete('/api/team/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.params;

    await db.collection('team_members').deleteOne({
      _id: new ObjectId(memberId)
    });

    res.json({ message: 'Team member removed' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// ============= AUDIT LOG ROUTES =============

// Get audit logs
app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, action, resource } = req.query;

    const query = {};
    if (action) query.action = action;
    if (resource) query.resource = resource;

    const logs = await db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// ============= SAVED QUERIES ROUTES =============

// Save query
app.post('/api/saved-queries', authenticateToken, async (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const userId = req.user.id;

    const savedQuery = {
      user_id: new ObjectId(userId),
      name,
      query,
      filters,
      created_at: new Date()
    };

    const result = await db.collection('saved_queries').insertOne(savedQuery);

    res.json({ ...savedQuery, _id: result.insertedId });
  } catch (error) {
    console.error('Save query error:', error);
    res.status(500).json({ error: 'Failed to save query' });
  }
});

// Get saved queries
app.get('/api/saved-queries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const queries = await db.collection('saved_queries')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    res.json(queries);
  } catch (error) {
    console.error('Get saved queries error:', error);
    res.status(500).json({ error: 'Failed to get saved queries' });
  }
});

// Delete saved query
app.delete('/api/saved-queries/:queryId', authenticateToken, async (req, res) => {
  try {
    const { queryId } = req.params;

    await db.collection('saved_queries').deleteOne({
      _id: new ObjectId(queryId)
    });

    res.json({ message: 'Saved query deleted' });
  } catch (error) {
    console.error('Delete saved query error:', error);
    res.status(500).json({ error: 'Failed to delete saved query' });
  }
});

// ============= ADVANCED SEARCH ROUTES =============

// Advanced search
app.post('/api/search', authenticateToken, async (req, res) => {
  try {
    const { collection, searchTerm, filters, sortBy, limit = 50 } = req.body;

    const query = {};
    
    // Text search
    if (searchTerm) {
      query.$text = { $search: searchTerm };
    }

    // Apply filters
    if (filters) {
      Object.assign(query, filters);
    }

    const results = await db.collection(collection)
      .find(query)
      .sort(sortBy || { _id: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

console.log('✅ Phase 3+ routes loaded');

}
