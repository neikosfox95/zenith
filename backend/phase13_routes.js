// ============= PHASE 13: REAL-TIME COLLABORATION & MULTI-USER =============
// Live collaboration, team workspaces, real-time editing

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupPhase13Routes(app, db, io, authenticateToken, ObjectId) {
  console.log('Setting up Phase 13 (Real-time Collaboration) routes...');

  // ============= WORKSPACES =============

  // Create workspace
  app.post('/api/workspace/create', authenticateToken, async (req, res) => {
    try {
      const { name, description, type, members = [] } = req.body;

      const workspace = {
        workspace_id: new ObjectId(),
        owner_id: req.user.userId,
        name,
        description,
        type, // 'team', 'agency', 'enterprise', 'personal'
        created_at: new Date(),
        members: [
          { user_id: req.user.userId, role: 'owner', joined_at: new Date() },
          ...members.map(m => ({ ...m, joined_at: new Date() }))
        ],
        settings: {
          visibility: 'private',
          allow_guests: false,
          require_approval: true,
          max_members: type === 'enterprise' ? 1000 : 50
        },
        features: {
          live_streaming: true,
          ai_assistant: true,
          analytics: true,
          custom_branding: type === 'enterprise',
          api_access: type === 'enterprise',
          sso: type === 'enterprise'
        },
        stats: {
          total_projects: 0,
          active_users: 1,
          storage_used: 0
        }
      };

      await db.collection('workspaces').insertOne(workspace);

      // Emit to socket for real-time update
      io.emit('workspace:created', { workspace_id: workspace.workspace_id.toString() });

      res.json({
        ...workspace,
        workspace_id: workspace.workspace_id.toString(),
        message: 'Workspace created successfully'
      });
    } catch (error) {
      console.error('Create workspace error:', error);
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  });

  // Get user workspaces
  app.get('/api/workspaces', authenticateToken, async (req, res) => {
    try {
      const workspaces = await db.collection('workspaces')
        .find({
          $or: [
            { owner_id: req.user.userId },
            { 'members.user_id': req.user.userId }
          ]
        })
        .toArray();

      res.json({
        workspaces: workspaces.map(w => ({ ...w, workspace_id: w.workspace_id.toString() })),
        count: workspaces.length
      });
    } catch (error) {
      console.error('Get workspaces error:', error);
      res.status(500).json({ error: 'Failed to retrieve workspaces' });
    }
  });

  // ============= LIVE COLLABORATION SESSIONS =============

  // Start collaboration session
  app.post('/api/collab/session/start', authenticateToken, async (req, res) => {
    try {
      const { workspace_id, project_id, type = 'document' } = req.body;

      const session = {
        session_id: new ObjectId(),
        workspace_id,
        project_id,
        host_id: req.user.userId,
        type, // 'document', 'video-edit', 'design', 'code', 'brainstorm'
        started_at: new Date(),
        status: 'active',
        participants: [
          { user_id: req.user.userId, joined_at: new Date(), role: 'host', cursor_color: '#FF0000' }
        ],
        activity: [],
        settings: {
          allow_edits: true,
          show_cursors: true,
          voice_enabled: true,
          recording: false
        }
      };

      await db.collection('collab_sessions').insertOne(session);

      // Notify workspace members
      io.to(`workspace:${workspace_id}`).emit('collab:session-started', {
        session_id: session.session_id.toString(),
        host_id: req.user.userId,
        project_id
      });

      res.json({
        ...session,
        session_id: session.session_id.toString(),
        join_url: `/collab/join/${session.session_id.toString()}`
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ error: 'Failed to start collaboration session' });
    }
  });

  // Join collaboration session
  app.post('/api/collab/session/join', authenticateToken, async (req, res) => {
    try {
      const { session_id } = req.body;

      const session = await db.collection('collab_sessions').findOne({ 
        session_id: new ObjectId(session_id),
        status: 'active'
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found or inactive' });
      }

      const participant = {
        user_id: req.user.userId,
        joined_at: new Date(),
        role: 'participant',
        cursor_color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };

      await db.collection('collab_sessions').updateOne(
        { session_id: new ObjectId(session_id) },
        { 
          $push: { participants: participant },
          $push: { activity: { type: 'user_joined', user_id: req.user.userId, timestamp: new Date() } }
        }
      );

      // Notify other participants
      io.to(`session:${session_id}`).emit('collab:user-joined', participant);

      res.json({
        session_id,
        participant,
        session_info: {
          type: session.type,
          host_id: session.host_id,
          started_at: session.started_at,
          participants_count: session.participants.length + 1
        }
      });
    } catch (error) {
      console.error('Join session error:', error);
      res.status(500).json({ error: 'Failed to join session' });
    }
  });

  // ============= REAL-TIME PRESENCE =============

  // Update user presence
  app.post('/api/collab/presence/update', authenticateToken, async (req, res) => {
    try {
      const { session_id, cursor_position, selection, status } = req.body;

      const presence = {
        user_id: req.user.userId,
        session_id,
        cursor_position,
        selection,
        status, // 'active', 'idle', 'typing', 'viewing'
        last_seen: new Date()
      };

      // Broadcast to session participants
      io.to(`session:${session_id}`).emit('collab:presence-update', presence);

      res.json({ success: true });
    } catch (error) {
      console.error('Presence update error:', error);
      res.status(500).json({ error: 'Failed to update presence' });
    }
  });

  // ============= LIVE COMMENTS & FEEDBACK =============

  // Add live comment
  app.post('/api/collab/comment/add', authenticateToken, async (req, res) => {
    try {
      const { session_id, content, position, type = 'text' } = req.body;

      const comment = {
        comment_id: new ObjectId(),
        session_id,
        user_id: req.user.userId,
        content,
        position, // { x, y } or { timestamp } for video
        type, // 'text', 'voice', 'drawing'
        created_at: new Date(),
        resolved: false,
        reactions: []
      };

      await db.collection('collab_comments').insertOne(comment);

      // Broadcast to session
      io.to(`session:${session_id}`).emit('collab:comment-added', {
        ...comment,
        comment_id: comment.comment_id.toString()
      });

      res.json({
        ...comment,
        comment_id: comment.comment_id.toString()
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  // ============= TEAM CHAT =============

  // Send team message
  app.post('/api/collab/chat/send', authenticateToken, async (req, res) => {
    try {
      const { workspace_id, channel_id, message, attachments = [] } = req.body;

      const chatMessage = {
        message_id: new ObjectId(),
        workspace_id,
        channel_id,
        user_id: req.user.userId,
        message,
        attachments,
        timestamp: new Date(),
        edited: false,
        reactions: [],
        thread_replies: 0
      };

      await db.collection('chat_messages').insertOne(chatMessage);

      // Broadcast to workspace/channel
      io.to(`workspace:${workspace_id}:${channel_id}`).emit('chat:message', {
        ...chatMessage,
        message_id: chatMessage.message_id.toString()
      });

      res.json({
        ...chatMessage,
        message_id: chatMessage.message_id.toString()
      });
    } catch (error) {
      console.error('Send chat error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // ============= VERSION CONTROL =============

  // Create snapshot
  app.post('/api/collab/snapshot/create', authenticateToken, async (req, res) => {
    try {
      const { project_id, description, data } = req.body;

      const snapshot = {
        snapshot_id: new ObjectId(),
        project_id,
        user_id: req.user.userId,
        description,
        data,
        created_at: new Date(),
        version: `v${Date.now()}`
      };

      await db.collection('project_snapshots').insertOne(snapshot);

      res.json({
        ...snapshot,
        snapshot_id: snapshot.snapshot_id.toString()
      });
    } catch (error) {
      console.error('Create snapshot error:', error);
      res.status(500).json({ error: 'Failed to create snapshot' });
    }
  });

  console.log('✅ Phase 13 (Real-time Collaboration) routes loaded');
}
