import { Expo } from 'expo-server-sdk';

/**
 * Sprint 2 Phase 4 EXPANDED: Comprehensive Push Notifications
 * 25+ notification types covering all app features
 */

const expo = new Expo();

// ============================================================
// EXPANDED iOS NOTIFICATION CATEGORIES (15 Total)
// ============================================================

export const IOS_NOTIFICATION_CATEGORIES = {
  // Original categories
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
    critical: true,
    actions: [
      { identifier: 'acknowledge', buttonTitle: 'Acknowledge', foreground: true }
    ]
  },
  
  // NEW: Analytics & Milestones
  MILESTONE: {
    categoryId: 'milestone',
    actions: [
      { identifier: 'view_stats', buttonTitle: '📊 View Stats', foreground: true },
      { identifier: 'share', buttonTitle: '🎉 Share' },
      { identifier: 'dismiss', buttonTitle: 'OK' }
    ]
  },
  
  // NEW: Fan Club Activities
  FAN_CLUB: {
    categoryId: 'fan_club',
    actions: [
      { identifier: 'view_member', buttonTitle: '👤 View Member', foreground: true },
      { identifier: 'welcome', buttonTitle: '👋 Send Welcome' },
      { identifier: 'dismiss', buttonTitle: 'OK' }
    ]
  },
  
  // NEW: Content Creation
  CONTENT_READY: {
    categoryId: 'content_ready',
    actions: [
      { identifier: 'view_content', buttonTitle: '👁️ View', foreground: true },
      { identifier: 'download', buttonTitle: '⬇️ Download' },
      { identifier: 'share', buttonTitle: '📤 Share' }
    ]
  },
  
  // NEW: AI Task Completion
  AI_TASK: {
    categoryId: 'ai_task',
    actions: [
      { identifier: 'view_result', buttonTitle: '✨ View Result', foreground: true },
      { identifier: 'regenerate', buttonTitle: '🔄 Regenerate' },
      { identifier: 'dismiss', buttonTitle: 'OK' }
    ]
  },
  
  // NEW: Collaboration
  TEAM_INVITE: {
    categoryId: 'team_invite',
    actions: [
      { identifier: 'accept', buttonTitle: '✅ Accept', foreground: true },
      { identifier: 'decline', buttonTitle: '❌ Decline' },
      { identifier: 'view', buttonTitle: '👁️ View Details' }
    ]
  },
  
  TASK_ASSIGNED: {
    categoryId: 'task_assigned',
    actions: [
      { identifier: 'view_task', buttonTitle: '📋 View Task', foreground: true },
      { identifier: 'accept', buttonTitle: '✅ Accept' },
      { identifier: 'defer', buttonTitle: '⏰ Defer' }
    ]
  },
  
  // NEW: Monetization
  PAYMENT: {
    categoryId: 'payment',
    actions: [
      { identifier: 'view_details', buttonTitle: '💰 View Details', foreground: true },
      { identifier: 'withdraw', buttonTitle: '🏦 Withdraw' },
      { identifier: 'dismiss', buttonTitle: 'OK' }
    ]
  },
  
  // NEW: Social Interactions
  NEW_FOLLOWER: {
    categoryId: 'new_follower',
    actions: [
      { identifier: 'view_profile', buttonTitle: '👤 View Profile', foreground: true },
      { identifier: 'follow_back', buttonTitle: '➕ Follow Back' },
      { identifier: 'dismiss', buttonTitle: 'OK' }
    ]
  },
  
  COMMENT: {
    categoryId: 'comment',
    actions: [
      { identifier: 'reply', buttonTitle: '💬 Reply', textInput: { placeholder: 'Reply...' } },
      { identifier: 'like', buttonTitle: '❤️ Like' },
      { identifier: 'view', buttonTitle: '👁️ View' }
    ]
  },
  
  // NEW: System & Scheduled
  REMINDER: {
    categoryId: 'reminder',
    actions: [
      { identifier: 'open', buttonTitle: '📅 Open', foreground: true },
      { identifier: 'snooze', buttonTitle: '⏰ Snooze 10min' },
      { identifier: 'dismiss', buttonTitle: 'Dismiss' }
    ]
  },
  
  SYSTEM_UPDATE: {
    categoryId: 'system_update',
    actions: [
      { identifier: 'update', buttonTitle: '⬆️ Update Now', foreground: true },
      { identifier: 'later', buttonTitle: 'Later' },
      { identifier: 'details', buttonTitle: 'Details' }
    ]
  }
};

// ============================================================
// EXPANDED Android NOTIFICATION CHANNELS (15 Total)
// ============================================================

export const ANDROID_NOTIFICATION_CHANNELS = {
  // Original channels
  LIVE_ALERTS: {
    id: 'live_alerts',
    name: 'Live Stream Alerts',
    description: 'Notifications when followed creators go live',
    importance: 'max',
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
    lockscreenVisibility: 'private'
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
  },
  
  // NEW: Milestones & Achievements
  MILESTONES: {
    id: 'milestones',
    name: 'Milestones & Achievements',
    description: 'Follower goals, revenue targets, and achievements',
    importance: 'high',
    sound: 'celebration.mp3',
    vibrationPattern: [0, 500, 100, 500, 100, 500],
    lightColor: '#FF69B4',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: Fan Club
  FAN_CLUB: {
    id: 'fan_club',
    name: 'Fan Club Activities',
    description: 'New members, level ups, and fan interactions',
    importance: 'high',
    sound: 'fanclub.mp3',
    vibrationPattern: [0, 300, 100, 300],
    lightColor: '#9C27B0',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: Content & AI
  CONTENT: {
    id: 'content',
    name: 'Content Processing',
    description: 'Video processing, AI generation, and exports',
    importance: 'default',
    sound: 'content_ready.mp3',
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#FF9800',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  AI_TASKS: {
    id: 'ai_tasks',
    name: 'AI Task Completion',
    description: 'AI image generation, video editing, and processing',
    importance: 'default',
    sound: 'ai_complete.mp3',
    vibrationPattern: [0, 250, 100, 250],
    lightColor: '#00BCD4',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: Collaboration
  TEAM: {
    id: 'team',
    name: 'Team Collaboration',
    description: 'Team invites, task assignments, and mentions',
    importance: 'high',
    sound: 'team.mp3',
    vibrationPattern: [0, 300, 150, 300],
    lightColor: '#4CAF50',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: Monetization
  PAYMENTS: {
    id: 'payments',
    name: 'Payments & Revenue',
    description: 'Payment received, withdrawals, and revenue milestones',
    importance: 'high',
    sound: 'payment.mp3',
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#4CAF50',
    showBadge: true,
    lockscreenVisibility: 'private'
  },
  
  // NEW: Social
  SOCIAL: {
    id: 'social',
    name: 'Social Interactions',
    description: 'New followers, likes, shares, and comments',
    importance: 'default',
    sound: 'social.mp3',
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#E91E63',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: Scheduled & Reminders
  REMINDERS: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Scheduled reminders and upcoming events',
    importance: 'high',
    sound: 'reminder.mp3',
    vibrationPattern: [0, 400, 100, 400, 100, 400],
    lightColor: '#FFEB3B',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: System
  SYSTEM: {
    id: 'system',
    name: 'System Notifications',
    description: 'App updates, maintenance, and important announcements',
    importance: 'high',
    sound: 'system.mp3',
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#607D8B',
    showBadge: true,
    lockscreenVisibility: 'public'
  },
  
  // NEW: Security
  SECURITY: {
    id: 'security',
    name: 'Security Alerts',
    description: 'Login attempts, password changes, and security warnings',
    importance: 'max',
    sound: 'alert.mp3',
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lightColor: '#F44336',
    showBadge: true,
    lockscreenVisibility: 'private'
  }
};

// Import base functions from original service
import pushNotificationBase from './pushNotifications.js';

// Re-export base functions
export const {
  isValidPushToken,
  registerPushToken,
  removePushToken,
  getUserPushTokens,
  sendRichNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationPreferences,
  checkReceiptStatus
} = pushNotificationBase;

// ============================================================
// NEW NOTIFICATION TYPES (20+ Additional)
// ============================================================

/**
 * 1. ANALYTICS: Follower Milestone
 */
export async function sendFollowerMilestone(db, userId, milestone) {
  const { count, previousMilestone } = milestone;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: `🎉 ${count.toLocaleString()} Followers!`,
    subtitle: 'Congratulations on reaching this milestone',
    body: `You've gained ${(count - previousMilestone).toLocaleString()} new followers! Keep it up!`,
    sound: 'celebration.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'milestone',
    channelId: 'milestones',
    color: '#FF69B4',
    icon: 'trophy_icon',
    image: 'https://example.com/milestone-badge.png',
    actions: [
      { id: 'view_stats', title: '📊 View Stats' },
      { id: 'share', title: '🎉 Share' }
    ],
    data: {
      type: 'follower_milestone',
      count,
      previousMilestone
    }
  });
}

/**
 * 2. ANALYTICS: Revenue Milestone
 */
export async function sendRevenueMilestone(db, userId, revenue) {
  const { amount, currency, period } = revenue;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: `💰 ${currency}${amount.toLocaleString()} Revenue!`,
    subtitle: `Earned in ${period}`,
    body: `Congratulations! You've reached a new revenue milestone. Time to celebrate!`,
    sound: 'payment.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'milestone',
    channelId: 'payments',
    color: '#4CAF50',
    icon: 'money_icon',
    actions: [
      { id: 'view_details', title: '💰 View Details' },
      { id: 'withdraw', title: '🏦 Withdraw' }
    ],
    data: {
      type: 'revenue_milestone',
      amount,
      currency,
      period
    }
  });
}

/**
 * 3. FAN CLUB: New Member
 */
export async function sendFanClubNewMember(db, userId, member) {
  const { memberName, memberAvatar, tier, message } = member;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: `🌟 New ${tier} Member!`,
    subtitle: memberName,
    body: message || `${memberName} just joined your fan club at the ${tier} tier!`,
    image: memberAvatar,
    sound: 'fanclub.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'fan_club',
    channelId: 'fan_club',
    color: '#9C27B0',
    actions: [
      { id: 'view_member', title: '👤 View Member' },
      { id: 'welcome', title: '👋 Send Welcome' }
    ],
    data: {
      type: 'fan_club_new_member',
      memberId: member.memberId,
      tier
    }
  });
}

/**
 * 4. FAN CLUB: Member Level Up
 */
export async function sendFanClubLevelUp(db, userId, levelUp) {
  const { memberName, oldTier, newTier, benefits } = levelUp;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: `⬆️ ${memberName} Leveled Up!`,
    subtitle: `${oldTier} → ${newTier}`,
    body: `${memberName} has upgraded to ${newTier} tier!`,
    sound: 'fanclub.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'fan_club',
    channelId: 'fan_club',
    color: '#9C27B0',
    data: {
      type: 'fan_club_level_up',
      memberId: levelUp.memberId,
      newTier
    }
  });
}

/**
 * 5. CONTENT: Video Processing Complete
 */
export async function sendVideoProcessingComplete(db, userId, video) {
  const { videoTitle, videoId, thumbnail, duration } = video;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '✅ Video Ready!',
    subtitle: videoTitle,
    body: `Your video "${videoTitle}" has been processed and is ready to view.`,
    image: thumbnail,
    sound: 'content_ready.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'content_ready',
    channelId: 'content',
    color: '#FF9800',
    actions: [
      { id: 'view_content', title: '👁️ View' },
      { id: 'download', title: '⬇️ Download' },
      { id: 'share', title: '📤 Share' }
    ],
    data: {
      type: 'video_processing_complete',
      videoId,
      duration
    }
  });
}

/**
 * 6. AI: Image Generation Complete
 */
export async function sendAIImageComplete(db, userId, imageData) {
  const { prompt, imageUrl, model, jobId } = imageData;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '✨ AI Image Ready!',
    subtitle: `Generated with ${model}`,
    body: `Your AI image for "${prompt.substring(0, 50)}..." is ready!`,
    image: imageUrl,
    sound: 'ai_complete.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'ai_task',
    channelId: 'ai_tasks',
    color: '#00BCD4',
    actions: [
      { id: 'view_result', title: '✨ View' },
      { id: 'regenerate', title: '🔄 Regenerate' },
      { id: 'download', title: '⬇️ Download' }
    ],
    data: {
      type: 'ai_image_complete',
      jobId,
      imageUrl,
      prompt
    }
  });
}

/**
 * 7. AI: Video Generation Complete
 */
export async function sendAIVideoComplete(db, userId, videoData) {
  const { prompt, videoUrl, model, duration } = videoData;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '🎬 AI Video Ready!',
    subtitle: `${duration}s video from ${model}`,
    body: `Your AI-generated video is ready to watch!`,
    sound: 'ai_complete.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'ai_task',
    channelId: 'ai_tasks',
    color: '#00BCD4',
    actions: [
      { id: 'view_result', title: '▶️ Watch' },
      { id: 'download', title: '⬇️ Download' },
      { id: 'share', title: '📤 Share' }
    ],
    data: {
      type: 'ai_video_complete',
      videoUrl,
      duration
    }
  });
}

/**
 * 8. TEAM: Team Invite
 */
export async function sendTeamInvite(db, userId, invite) {
  const { teamName, inviterName, role, teamLogo } = invite;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '🤝 Team Invitation',
    subtitle: `${inviterName} invited you`,
    body: `You've been invited to join "${teamName}" as ${role}`,
    image: teamLogo,
    sound: 'team.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'team_invite',
    channelId: 'team',
    color: '#4CAF50',
    actions: [
      { id: 'accept', title: '✅ Accept' },
      { id: 'decline', title: '❌ Decline' },
      { id: 'view', title: '👁️ Details' }
    ],
    data: {
      type: 'team_invite',
      inviteId: invite.inviteId,
      teamId: invite.teamId
    }
  });
}

/**
 * 9. TEAM: Task Assigned
 */
export async function sendTaskAssigned(db, userId, task) {
  const { taskTitle, assignerName, dueDate, priority } = task;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
  
  return await sendRichNotification(tokens, {
    title: `${priorityEmoji} Task Assigned`,
    subtitle: taskTitle,
    body: `${assignerName} assigned you a task. Due: ${new Date(dueDate).toLocaleDateString()}`,
    sound: 'team.mp3',
    badge: 1,
    priority: priority === 'high' ? 'high' : 'default',
    categoryId: 'task_assigned',
    channelId: 'team',
    color: '#4CAF50',
    actions: [
      { id: 'view_task', title: '📋 View Task' },
      { id: 'accept', title: '✅ Accept' }
    ],
    data: {
      type: 'task_assigned',
      taskId: task.taskId,
      priority
    }
  });
}

/**
 * 10. PAYMENT: Payment Received
 */
export async function sendPaymentReceived(db, userId, payment) {
  const { amount, currency, source, transactionId } = payment;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '💰 Payment Received!',
    subtitle: `${currency}${amount.toFixed(2)}`,
    body: `You received ${currency}${amount.toFixed(2)} from ${source}`,
    sound: 'payment.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'payment',
    channelId: 'payments',
    color: '#4CAF50',
    icon: 'payment_icon',
    actions: [
      { id: 'view_details', title: '💰 View Details' },
      { id: 'withdraw', title: '🏦 Withdraw' }
    ],
    data: {
      type: 'payment_received',
      amount,
      currency,
      transactionId
    }
  });
}

/**
 * 11. SOCIAL: New Follower
 */
export async function sendNewFollower(db, userId, follower) {
  const { followerName, followerAvatar, followerUsername } = follower;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '👤 New Follower!',
    subtitle: followerName,
    body: `@${followerUsername} started following you`,
    image: followerAvatar,
    sound: 'social.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'new_follower',
    channelId: 'social',
    color: '#E91E63',
    actions: [
      { id: 'view_profile', title: '👤 View Profile' },
      { id: 'follow_back', title: '➕ Follow Back' }
    ],
    data: {
      type: 'new_follower',
      followerId: follower.followerId
    }
  });
}

/**
 * 12. SOCIAL: Comment on Your Content
 */
export async function sendNewComment(db, userId, comment) {
  const { commenterName, commentText, contentTitle, contentThumbnail } = comment;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: `💬 ${commenterName} commented`,
    subtitle: contentTitle,
    body: commentText.substring(0, 100),
    image: contentThumbnail,
    sound: 'message.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'comment',
    channelId: 'social',
    color: '#E91E63',
    actions: [
      { id: 'reply', title: '💬 Reply', textInput: true },
      { id: 'like', title: '❤️ Like' },
      { id: 'view', title: '👁️ View' }
    ],
    data: {
      type: 'new_comment',
      commentId: comment.commentId,
      contentId: comment.contentId
    }
  });
}

/**
 * 13. REMINDER: Scheduled Live Stream
 */
export async function sendLiveStreamReminder(db, userId, reminder) {
  const { creatorName, scheduledTime, title } = reminder;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '⏰ Live Stream Starting Soon!',
    subtitle: `${creatorName} in 10 minutes`,
    body: title || `${creatorName}'s live stream starts at ${new Date(scheduledTime).toLocaleTimeString()}`,
    sound: 'reminder.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'reminder',
    channelId: 'reminders',
    color: '#FFEB3B',
    actions: [
      { id: 'open', title: '📅 Join Now' },
      { id: 'snooze', title: '⏰ Snooze' }
    ],
    data: {
      type: 'live_stream_reminder',
      creatorId: reminder.creatorId,
      scheduledTime
    }
  });
}

/**
 * 14. SYSTEM: App Update Available
 */
export async function sendAppUpdateAvailable(db, userId, update) {
  const { version, features, size } = update;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '⬆️ Update Available',
    subtitle: `Version ${version}`,
    body: `New features: ${features.join(', ')}. Size: ${size}MB`,
    sound: 'system.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'system_update',
    channelId: 'system',
    color: '#607D8B',
    actions: [
      { id: 'update', title: '⬆️ Update Now' },
      { id: 'later', title: 'Later' },
      { id: 'details', title: 'Details' }
    ],
    data: {
      type: 'app_update',
      version,
      features
    }
  });
}

/**
 * 15. SECURITY: New Login Detected
 */
export async function sendSecurityAlert(db, userId, alert) {
  const { device, location, ipAddress, timestamp } = alert;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '🔐 New Login Detected',
    subtitle: device,
    body: `Someone logged in from ${location} (${ipAddress})`,
    sound: 'alert.mp3',
    badge: 1,
    priority: 'high',
    critical: true, // iOS critical alert
    categoryId: 'alert_critical',
    channelId: 'security',
    color: '#F44336',
    actions: [
      { id: 'acknowledge', title: 'This was me' },
      { id: 'secure', title: '🔒 Secure Account' }
    ],
    data: {
      type: 'security_alert',
      device,
      location,
      timestamp
    }
  });
}

/**
 * 16. ANALYTICS: Daily Summary
 */
export async function sendDailySummary(db, userId, summary) {
  const { views, likes, comments, followers, revenue } = summary;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '📊 Your Daily Summary',
    subtitle: new Date().toLocaleDateString(),
    body: `${views} views • ${likes} likes • ${comments} comments • ${followers} new followers`,
    sound: null, // Silent
    badge: 0,
    priority: 'low',
    channelId: 'analytics',
    color: '#00FF00',
    style: 'bigText',
    data: {
      type: 'daily_summary',
      summary
    }
  });
}

/**
 * 17. CONTENT: Export Complete
 */
export async function sendExportComplete(db, userId, exportData) {
  const { fileName, fileSize, format, downloadUrl } = exportData;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '📦 Export Complete!',
    subtitle: fileName,
    body: `Your ${format.toUpperCase()} export (${fileSize}MB) is ready to download`,
    sound: 'content_ready.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'content_ready',
    channelId: 'content',
    color: '#FF9800',
    actions: [
      { id: 'download', title: '⬇️ Download' },
      { id: 'share', title: '📤 Share' }
    ],
    data: {
      type: 'export_complete',
      downloadUrl,
      format
    }
  });
}

/**
 * 18. SOCIAL: Trending Content
 */
export async function sendTrendingContent(db, userId, trending) {
  const { contentTitle, views, thumbnail, category } = trending;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '🔥 Your Content is Trending!',
    subtitle: contentTitle,
    body: `${views.toLocaleString()} views in the last hour! 🚀`,
    image: thumbnail,
    sound: 'celebration.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'milestone',
    channelId: 'social',
    color: '#FF69B4',
    actions: [
      { id: 'view', title: '👁️ View' },
      { id: 'share', title: '📤 Share' }
    ],
    data: {
      type: 'trending_content',
      contentId: trending.contentId,
      category
    }
  });
}

/**
 * 19. FAN CLUB: Badge Unlocked
 */
export async function sendBadgeUnlocked(db, userId, badge) {
  const { badgeName, badgeIcon, description } = badge;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: '🏆 Badge Unlocked!',
    subtitle: badgeName,
    body: description,
    image: badgeIcon,
    sound: 'celebration.mp3',
    badge: 1,
    priority: 'default',
    categoryId: 'milestone',
    channelId: 'milestones',
    color: '#FFD700',
    actions: [
      { id: 'view', title: '👁️ View Badge' },
      { id: 'share', title: '🎉 Share' }
    ],
    data: {
      type: 'badge_unlocked',
      badgeId: badge.badgeId
    }
  });
}

/**
 * 20. TEAM: Mention in Comment
 */
export async function sendMention(db, userId, mention) {
  const { mentionerName, contentType, contentTitle, commentText } = mention;
  const tokens = await getUserPushTokens(db, userId);
  
  if (tokens.length === 0) return { success: false };
  
  return await sendRichNotification(tokens, {
    title: `@mention by ${mentionerName}`,
    subtitle: `In ${contentType}: ${contentTitle}`,
    body: commentText.substring(0, 100),
    sound: 'message.mp3',
    badge: 1,
    priority: 'high',
    categoryId: 'comment',
    channelId: 'team',
    color: '#4CAF50',
    actions: [
      { id: 'reply', title: '💬 Reply', textInput: true },
      { id: 'view', title: '👁️ View' }
    ],
    data: {
      type: 'mention',
      commentId: mention.commentId
    }
  });
}

export default {
  // Original exports
  isValidPushToken,
  registerPushToken,
  removePushToken,
  getUserPushTokens,
  sendRichNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationPreferences,
  checkReceiptStatus,
  
  // Original notification types
  sendLiveStreamAlert: pushNotificationBase.sendLiveStreamAlert,
  sendGiftNotification: pushNotificationBase.sendGiftNotification,
  sendProgressNotification: pushNotificationBase.sendProgressNotification,
  sendInboxNotification: pushNotificationBase.sendInboxNotification,
  sendSilentNotification: pushNotificationBase.sendSilentNotification,
  
  // NEW: 20+ Notification types
  sendFollowerMilestone,
  sendRevenueMilestone,
  sendFanClubNewMember,
  sendFanClubLevelUp,
  sendVideoProcessingComplete,
  sendAIImageComplete,
  sendAIVideoComplete,
  sendTeamInvite,
  sendTaskAssigned,
  sendPaymentReceived,
  sendNewFollower,
  sendNewComment,
  sendLiveStreamReminder,
  sendAppUpdateAvailable,
  sendSecurityAlert,
  sendDailySummary,
  sendExportComplete,
  sendTrendingContent,
  sendBadgeUnlocked,
  sendMention,
  
  // Constants
  IOS_NOTIFICATION_CATEGORIES,
  ANDROID_NOTIFICATION_CHANNELS
};
