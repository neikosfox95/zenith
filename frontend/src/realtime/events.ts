/**
 * ============================================================
 * REALTIME EVENT CONTRACT — client side
 * ============================================================
 * Source of truth: docs/REALTIME_EVENT_CONTRACT.md
 * Server mirror:   backend/lib/realtime-events.js
 *
 * WHY THIS EXISTS
 * ---------------
 * The frontend hooks subscribed to `creator:status`, `creator:viewers`,
 * `live:gift`, `live:comment`, `analytics:delta`… while the backend emitted
 * `creator_live`, `viewer_update`, `new_gift`, `new_chat`. Not one name
 * matched, so the socket connected, the UI reported "live", and no event ever
 * arrived. Every realtime screen silently fell back to mock data.
 *
 * The backend now emits the canonical names *and* its legacy aliases. This
 * module is the client's half of that contract: subscribe through it and a
 * future rename only has to happen in one place per side.
 */

/** Canonical event names — must mirror backend/lib/realtime-events.js. */
export const REALTIME_EVENTS = {
  STREAM_STARTED: 'stream:started',
  STREAM_ENDED: 'stream:ended',
  CREATOR_STATUS: 'creator:status',
  CREATOR_VIEWERS: 'creator:viewers',

  LIVE_COMMENT: 'live:comment',
  LIVE_GIFT: 'live:gift',
  LIVE_LIKE: 'live:like',
  LIVE_SHARE: 'live:share',
  LIVE_FOLLOW: 'live:follow',
  LIVE_JOIN: 'live:join',
  LIVE_BATCH: 'live:batch',
  LIVE_EVENT: 'live:event',

  ANALYTICS_DELTA: 'analytics:delta',
  ANALYTICS_FULL: 'analytics:full',
  ANALYTICS_VIEWERS: 'analytics:viewers',

  BADGE_EARNED: 'badge_earned',
  FAN_TIER_UPGRADE: 'fan_tier_upgrade',
  MILESTONE_ACHIEVED: 'milestone_achieved',
  GIFT_COMBO_MILESTONE: 'gift_combo_milestone',
  GIFT_STREAK_MILESTONE: 'gift_streak_milestone',
  TREASURE_BOX_OPENED: 'treasure_box_opened',
  CLIP_CREATED: 'clip_created',
  NOTIFICATION: 'notification',
  SUBSCRIPTION_CREATED: 'new_subscription',
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Per-user room name — mirrors `userRoom()` in backend/lib/realtime-events.js.
 *
 * Targeted events (`notification`, private analytics) are broadcast into this
 * room. The server joins a socket to it automatically once the socket
 * authenticates (`auth: { token }` on connect, or `emit('authenticate', …)`),
 * so clients rarely build this string themselves.
 */
export const userRoom = (userId: string): string => `user:${userId}`;

/** Creator-scoped room, joined via `emit('watch:creator', { creator_id })`. */
export const creatorRoom = (creatorId: string): string => `creator:${creatorId}`;

/**
 * Legacy names the server still emits. Subscribe to these only if you are
 * maintaining a screen that has not been migrated yet.
 */
export const LEGACY_EVENTS = {
  CREATOR_LIVE: 'creator_live',
  CREATOR_OFFLINE: 'creator_offline',
  VIEWER_UPDATE: 'viewer_update',
  NEW_CHAT: 'new_chat',
  NEW_GIFT: 'new_gift',
  NEW_LIKE: 'new_like',
  NEW_SHARE: 'new_share',
  NEW_FOLLOW: 'new_follow',
  MEMBER_JOIN: 'member_join',
  NEW_ACTIVITY: 'new_activity',
} as const;

// ------------------------------------------------------------
// Payload types (see the contract doc for field-by-field detail)
// ------------------------------------------------------------

export interface BaseEventPayload {
  creator_id?: string;
  tiktok_username?: string;
  stream_id?: string;
  /** Present on the generic `live:event` wrapper. */
  type?: string;
  timestamp?: string;
}

export interface ActorFields {
  user_id?: string;
  username?: string;
  nickname?: string;
  /** Legacy field names from the old `new_gift` / `new_chat` payloads. */
  sender_username?: string;
  sender_nickname?: string;
}

export interface StreamStartedPayload extends BaseEventPayload {
  title?: string;
  viewer_count?: number;
  started_at?: string;
}

export interface StreamEndedPayload extends BaseEventPayload {
  viewer_count?: number;
  ended_at?: string;
}

export interface CreatorStatusPayload extends BaseEventPayload {
  is_live?: boolean;
  viewer_count?: number;
  stream_title?: string;
  /** Store field, set client-side when a creator transitions to live. */
  last_live_at?: string;
  /** Store field, written on every realtime update. */
  updated_at?: string;
  /** Peak concurrent viewers for the current stream. */
  peak_viewers?: number;
}

export interface CreatorViewersPayload extends BaseEventPayload {
  viewer_count: number;
}

export interface CommentPayload extends BaseEventPayload, ActorFields {
  text?: string;
  /** Legacy field name from the old `new_chat` payload. */
  message?: string;
  emotes?: unknown[];
}

export interface GiftPayload extends BaseEventPayload, ActorFields {
  gift_name?: string;
  gift_id?: string | number;
  repeat_count?: number;
  diamonds?: number;
  coins?: number;
  group_id?: string;
  /** Legacy field names from the old `new_gift` payload. */
  sender_username?: string;
  sender_nickname?: string;
}

export interface LikePayload extends BaseEventPayload, ActorFields {
  count?: number;
  total?: number;
  /** Legacy field name. */
  like_count?: number;
}

export interface SharePayload extends BaseEventPayload, ActorFields {
  count?: number;
}

export interface FollowPayload extends BaseEventPayload, ActorFields {}

export interface JoinPayload extends BaseEventPayload, ActorFields {}

export interface AnalyticsDeltaPayload extends BaseEventPayload {
  metrics?: Partial<Record<'viewers' | 'likes' | 'gifts' | 'diamonds' | 'shares' | 'comments', number>>;
}

export interface LiveBatchPayload extends BaseEventPayload {
  window_ms?: number;
  events?: (BaseEventPayload & { type?: string })[];
  counts?: Partial<Record<'comment' | 'gift' | 'like' | 'share' | 'follow' | 'join', number>>;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Creator identity resolver.
 *
 * The Zustand store keys creators by `id`; socket payloads carry
 * `creator_id`. Legacy payloads used `sender_username`. Resolve defensively so
 * a payload from either generation still updates the right record.
 */
export function creatorIdFrom(payload?: BaseEventPayload | null): string | undefined {
  if (!payload) return undefined;
  const anyPayload = payload as Record<string, unknown>;
  const candidate = anyPayload.creator_id ?? anyPayload.id ?? anyPayload.creatorId;
  if (typeof candidate === 'string' && candidate) return candidate;
  // Mongo extended-JSON shape, in case a raw ObjectId ever leaks through.
  if (candidate && typeof candidate === 'object' && '$oid' in (candidate as object)) {
    return String((candidate as { $oid: unknown }).$oid);
  }
  return undefined;
}

/** Display name resolver across the old and new payload shapes. */
export function actorNameFrom(payload?: ActorFields | null): string {
  if (!payload) return 'Unknown';
  return payload.nickname || payload.username || payload.sender_nickname || payload.sender_username || 'Unknown';
}

/** Comment text resolver (canonical `text`, legacy `message`). */
export function commentTextFrom(payload?: CommentPayload | null): string {
  return payload?.text ?? payload?.message ?? '';
}

/** Like count resolver (canonical `count`, legacy `like_count`). */
export function likeCountFrom(payload?: LikePayload | null): number {
  return Number(payload?.count ?? payload?.like_count ?? payload?.total ?? 0) || 0;
}

export default REALTIME_EVENTS;
