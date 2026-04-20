import { Expo } from 'expo-server-sdk';

/**
 * Sprint 2 Phase 4: EXPERT-LEVEL Push Notifications Service
 * Optimized for latest iPhone, Google Pixel, and Samsung Galaxy devices
 * Supports iOS 17+ and Android 14+ advanced features
 */

// Create a new Expo SDK client
const expo = new Expo();

/**
 * PLATFORM-SPECIFIC CONFIGURATIONS
 */

// iOS-specific notification categories with actions
export const IOS_NOTIFICATION_CATEGORIES = {
  MESSAGE: {
    categoryId: 'message',
    actions: [
      { identifier: 'reply', buttonTitle: 'Reply', textInput: { placeholder: 'Type a message...' } },
      { identifier: 'mark_read', buttonTitle: 'Mark as Read' },
      { identifier: 'delete', buttonTitle: 'Delete', destructive: true }
    ]
  },
  LIVE_STREAM: {
    categoryId: 'live_stream',
    actions: [
      { identifier: 'watch', buttonTitle: 'Watch Now', foreground: true },
      { identifier: 'remind', buttonTitle: 'Remind Me Later' },
      { identifier: 'dismiss', buttonTitle: 'Dismiss' }
    ]
  },
  GIFT_RECEIVED: {
    categoryId: 'gift',
    actions: [
      { identifier: 'thank', buttonTitle: 'Send Thanks', foreground: true },
      { identifier: 'view', buttonTitle: 'View Gift' },
      { identifier: 'dismiss', buttonTitle: 'Dismiss' }
    ]
  },
  ALERT_CRITICAL: {
    categoryId: 'alert_critical',
    critical: true, // iOS Critical Alerts (bypass Do Not Disturb)
    actions: [
      { identifier: 'acknowledge', buttonTitle: 'Acknowledge', foreground: true }
    ]
  }
};

// Android-specific notification channels
export const ANDROID_NOTIFICATION_CHANNELS = {
  LIVE_ALERTS: {
    id: 'live_alerts',
    name: 'Live Stream Alerts',
    description: 'Notifications when followed creators go live',
    importance: 'max', // IMPORTANCE_MAX for Android
    sound: 'live_alert.mp3',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF0000',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  GIFTS: {
    id: 'gifts',
    name: 'Gift Notifications',
    description: 'Notifications for gifts received',
    importance: 'high',
    sound: 'gift_received.mp3',
    vibrationPattern: [0, 400, 200, 400],
    lightColor: '#FFD700',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  MESSAGES: {
    id: 'messages',
    name: 'Messages',
    description: 'Direct messages and comments',
    importance: 'high',
    sound: 'message.mp3',
    vibrationPattern: [0, 300, 100, 300],
    lightColor: '#0000FF',
    showBadge: true,
    lockscreenVisibility: 'private',
    enableLights: true,
    enableVibration: true
  },
  ANALYTICS: {
    id: 'analytics',
    name: 'Analytics Updates',
    description: 'Performance and analytics updates',
    importance: 'default',
    sound: 'default',
    vibrationPattern: [0, 200],
    lightColor: '#00FF00',
    showBadge: false,
    lockscreenVisibility: 'public'
  },
  SILENT: {
    id: 'silent',
    name: 'Silent Notifications',
    description: 'Background data updates',
    importance: 'low',
    sound: null,
    vibrationPattern: null,
    showBadge: false,
    lockscreenVisibility: 'secret'
  }
};

/**
 * Validate Expo push token
 */
export function isValidPushToken(token) {
  return Expo.isExpoPushToken(token);
}

/**
 * Register push token with device info
 */
export async function registerPushToken(db, userId, token, deviceInfo = {}) {
  if (!isValidPushToken(token)) {
    throw new Error('Invalid push token format');
  }
  
  const { platform, deviceModel, osVersion, appVersion } = deviceInfo;
  
  // Check if token already exists
  const existing = await db.collection('push_tokens').findOne({ token });
  
  if (existing) {
    // Update existing token
    await db.collection('push_tokens').updateOne(
      { token },
      { 
        $set: { 
          userId,
          platform,
          deviceModel,
          osVersion,
          appVersion,
          updatedAt: new Date()
        }
      }
    );
    return { ...existing, userId, platform, updatedAt: new Date() };
  }
  
  // Create new token with device info
  const tokenDoc = {
    userId,
    token,
    platform, // 'ios' or 'android'
    deviceModel, // 'iPhone 15 Pro', 'Pixel 8 Pro', 'Galaxy S24 Ultra'
    osVersion, // 'iOS 17.2', 'Android 14'
    appVersion, // '1.0.0'
    active: true,
    preferences: {
      liveAlerts: true,
      gifts: true,
      messages: true,
      analytics: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await db.collection('push_tokens').insertOne(tokenDoc);
  return { ...tokenDoc, _id: result.insertedId };
}

/**
 * EXPERT: Send rich notification with platform-specific features
 */
export async function sendRichNotification(tokens, notification) {
  const {
    title,
    body,
    subtitle, // iOS only
    data = {},
    sound = 'default',
    badge = null,
    priority = 'high',
    categoryId, // iOS category
    channelId, // Android channel
    image, // Rich notification image URL
    icon, // Android notification icon
    color, // Android notification color
    actions = [], // Action buttons
    groupId, // Notification grouping
    groupSummary, // Group summary text
    style = 'default', // 'default', 'bigText', 'bigPicture', 'inbox', 'progress'
    progress, // For progress notifications { current, max, indeterminate }
    critical = false, // iOS critical alert
    threadId, // iOS thread identifier for grouping
    collapseId // Android collapse ID
  } = notification;
  
  const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
  
  if (validTokens.length === 0) {
    return { success: false, error: 'No valid push tokens' };
  }
  
  // Build platform-optimized messages
  const messages = validTokens.map(token => {
    const message = {
      to: token,
      title,
      body,
      data: {
        ...data,
        channelId: channelId || 'default',
        categoryId: categoryId || null,
        style,
        groupId,
        collapseId
      },
      sound: sound === 'default' ? 'default' : sound,
      badge,
      priority: critical ? 'high' : priority,
    };
    
    // iOS-specific features
    if (subtitle) {
      message.subtitle = subtitle;
    }
    
    if (categoryId) {
      message.categoryId = categoryId;
    }
    
    if (threadId) {
      message.threadId = threadId;
    }
    
    if (critical) {
      message.priority = 'high';
      message.sound = {
        critical: true,
        name: sound || 'default',
        volume: 1.0
      };
    }
    
    // Android-specific features
    if (channelId) {
      message.channelId = channelId;
    }
    
    if (image) {
      message.data.image = image;
      message.data.style = 'bigPicture';
    }
    
    if (icon) {
      message.data.icon = icon;
    }
    
    if (color) {
      message.data.color = color;
    }
    
    if (actions && actions.length > 0) {
      message.data.actions = actions;
    }
    
    if (groupId) {
      message.data.groupId = groupId;
      if (groupSummary) {
        message.data.groupSummary = groupSummary;
      }
    }
    
    if (progress) {
      message.data.progress = progress;
      message.data.style = 'progress';
    }
    
    return message;
  });
  
  // Send in chunks
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }
  
  return {
    success: true,
    tickets,
    sentCount: tickets.length
  };
}

/**
 * EXPERT: Send live stream alert (optimized for immediate delivery)
 */
export async function sendLiveStreamAlert(db, creatorUsername, creatorAvatar) {
  // Get all users following this creator
  const creator = await db.collection('creators').findOne({ tiktok_username: creatorUsername });
  
  if (!creator) {
    return { success: false, error: 'Creator not found' };
  }
  
  // Get follower tokens
  const followers = await db.collection('user_creators')
    .find({ creator_id: creator._id })
    .toArray();
  
  const userIds = followers.map(f => f.user_id);
  
  // Get push tokens for all followers
  const tokenDocs = await db.collection('push_tokens')
    .find({ 
      userId: { $in: userIds.map(id => id.toString()) },
      active: true,
      'preferences.liveAlerts': true
    })
    .toArray();
  
  const tokens = tokenDocs.map(t => t.token);
  
  if (tokens.length === 0) {
    return { success: false, error: 'No followers with push enabled' };
  }
  
  // Send rich notification with image
  return await sendRichNotification(tokens, {
    title: `🔴 ${creatorUsername} is LIVE!`,
    subtitle: 'Tap to watch now',
    body: `${creatorUsername} just started a live stream. Don't miss it!`,
    image: creatorAvatar,
    sound: 'live_alert.mp3',
    badge: 1,
    priority: 'high',
    critical: true, // iOS critical alert
    categoryId: IOS_NOTIFICATION_CATEGORIES.LIVE_STREAM.categoryId,
    channelId: ANDROID_NOTIFICATION_CHANNELS.LIVE_ALERTS.id,
    color: '#FF0000',
    icon: 'live_icon',
    actions: [
      { id: 'watch', title: '▶️ Watch Now' },
      { id: 'remind', title: '⏰ Remind Later' }
    ],
    data: {
      type: 'live_stream',
      creatorId: creator._id.toString(),
      creatorUsername,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * EXPERT: Send gift received notification (with rich formatting)
 */
export async function sendGiftNotification(db, userId, giftData) {
  const { giftName, giftIcon, senderName, diamonds, message } = giftData;
  
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) {
    return { success: false, error: 'User has no registered push tokens' };
  }
  
  return await sendRichNotification(tokens, {
    title: `🎁 Gift from ${senderName}`,
    subtitle: `${giftName} (${diamonds} 💎)`,
    body: message || `${senderName} sent you a ${giftName}!`,
    image: giftIcon,
    sound: 'gift_received.mp3',
    badge: 1,
    priority: 'high',
    categoryId: IOS_NOTIFICATION_CATEGORIES.GIFT_RECEIVED.categoryId,
    channelId: ANDROID_NOTIFICATION_CHANNELS.GIFTS.id,
    color: '#FFD700',
    icon: 'gift_icon',
    actions: [
      { id: 'thank', title: '💝 Send Thanks' },
      { id: 'view', title: '👀 View Gift' }
    ],
    groupId: 'gifts',
    data: {
      type: 'gift_received',
      giftId: giftData.giftId,
      senderId: giftData.senderId,
      diamonds
    }
  });
}

/**
 * EXPERT: Send progress notification (for long-running tasks)
 */
export async function sendProgressNotification(db, userId, progressData) {
  const { title, taskId, current, max, indeterminate = false } = progressData;
  
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) {
    return { success: false };
  }
  
  const percentage = indeterminate ? 0 : Math.round((current / max) * 100);
  
  return await sendRichNotification(tokens, {
    title,
    body: indeterminate ? 'Processing...' : `${percentage}% complete`,
    sound: null, // Silent
    priority: 'low',
    channelId: ANDROID_NOTIFICATION_CHANNELS.SILENT.id,
    style: 'progress',
    progress: {
      current,
      max,
      indeterminate
    },
    data: {
      type: 'progress',
      taskId,
      current,
      max
    }
  });
}

/**
 * EXPERT: Send inbox-style notification (multiple messages grouped)
 */
export async function sendInboxNotification(db, userId, messages) {
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) {
    return { success: false };
  }
  
  const messageCount = messages.length;
  const latestMessage = messages[messages.length - 1];
  
  return await sendRichNotification(tokens, {
    title: `${messageCount} new messages`,
    body: latestMessage.text,
    sound: 'message.mp3',
    badge: messageCount,
    priority: 'high',
    categoryId: IOS_NOTIFICATION_CATEGORIES.MESSAGE.categoryId,
    channelId: ANDROID_NOTIFICATION_CHANNELS.MESSAGES.id,
    color: '#0000FF',
    style: 'inbox',
    groupId: 'messages',
    groupSummary: `You have ${messageCount} new messages`,
    actions: [
      { id: 'reply', title: '✉️ Reply', textInput: true },
      { id: 'mark_read', title: '✓ Mark Read' }
    ],
    data: {
      type: 'messages',
      messages: messages.map(m => ({
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp
      })),
      messageCount
    }
  });
}

/**
 * EXPERT: Send silent data notification (background sync)
 */
export async function sendSilentNotification(db, userId, data) {
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) {
    return { success: false };
  }
  
  return await sendRichNotification(tokens, {
    title: null, // Silent notification
    body: null,
    sound: null,
    badge: null,
    priority: 'low',
    channelId: ANDROID_NOTIFICATION_CHANNELS.SILENT.id,
    data: {
      type: 'silent_sync',
      ...data,
      contentAvailable: true // iOS background content
    }
  });
}

/**
 * Get user's push tokens
 */
export async function getUserPushTokens(db, userId) {
  const tokens = await db.collection('push_tokens')
    .find({ userId, active: true })
    .toArray();
  
  return tokens.map(t => t.token);
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(db, userId, preferences) {
  await db.collection('push_tokens').updateMany(
    { userId },
    { $set: { preferences, updatedAt: new Date() } }
  );
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(db, userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [notifications, total] = await Promise.all([
    db.collection('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('notifications').countDocuments({ userId })
  ]);
  
  const unreadCount = await db.collection('notifications')
    .countDocuments({ userId, read: false });
  
  return {
    data: notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount
    }
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(db, notificationId, userId) {
  const { ObjectId } = await import('mongodb');
  await db.collection('notifications').updateOne(
    { _id: new ObjectId(notificationId), userId },
    { $set: { read: true, readAt: new Date() } }
  );
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(db, userId) {
  await db.collection('notifications').updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
}

/**
 * Delete notification
 */
export async function deleteNotification(db, notificationId, userId) {
  const { ObjectId } = await import('mongodb');
  await db.collection('notifications').deleteOne({
    _id: new ObjectId(notificationId),
    userId
  });
}

/**
 * Check receipt status
 */
export async function checkReceiptStatus(receiptIds) {
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  const receipts = [];
  
  for (const chunk of receiptIdChunks) {
    try {
      const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
      receipts.push(receiptChunk);
    } catch (error) {
      console.error('Error checking receipt status:', error);
    }
  }
  
  return receipts;
}

/**
 * Remove push token
 */
export async function removePushToken(db, token) {
  await db.collection('push_tokens').deleteOne({ token });
}

export default {
  // Core functions
  isValidPushToken,
  registerPushToken,
  removePushToken,
  getUserPushTokens,
  
  // Expert notification types
  sendRichNotification,
  sendLiveStreamAlert,
  sendGiftNotification,
  sendProgressNotification,
  sendInboxNotification,
  sendSilentNotification,
  
  // Notification management
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationPreferences,
  checkReceiptStatus,
  
  // Constants
  IOS_NOTIFICATION_CATEGORIES,
  ANDROID_NOTIFICATION_CHANNELS
};
