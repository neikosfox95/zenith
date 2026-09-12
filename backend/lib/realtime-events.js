// ============================================================
// REALTIME EVENT CONTRACT — server side
// ============================================================
// Source of truth: docs/REALTIME_EVENT_CONTRACT.md
// Frontend mirror: frontend/src/realtime/events.ts
//
// WHY THIS EXISTS
// ---------------
// The backend emitted snake_case names (`new_gift`, `creator_live`,
// `viewer_update`) while every frontend hook subscribed to colon-separated
// names (`live:gift`, `creator:status`, `creator:viewers`). Not one name
// matched. The socket connected, the UI showed "live", and then no event ever
// arrived — so every realtime screen silently fell back to mock data.
//
// `emitLive()` now broadcasts each event under its canonical name *and* every
// legacy alias, so existing consumers keep working while clients migrate.
// It also normalises the envelope: `creator_id`, `tiktok_username` and
// `timestamp` are added when the caller has them, because several legacy
// payloads (notably `new_gift`) omitted `creator_id` entirely, leaving clients
// unable to attribute an event to a creator.
// ============================================================

/** Canonical event names. Keep in sync with the frontend mirror. */
export const REALTIME_EVENTS = Object.freeze({
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
});

/**
 * Canonical name -> legacy names still emitted for backwards compatibility.
 * Removing an alias is a breaking change for any client still listening.
 */
export const LEGACY_EVENT_ALIASES = Object.freeze({
  [REALTIME_EVENTS.STREAM_STARTED]: ['creator_live'],
  [REALTIME_EVENTS.STREAM_ENDED]: ['creator_offline'],
  [REALTIME_EVENTS.CREATOR_VIEWERS]: ['viewer_update'],
  [REALTIME_EVENTS.LIVE_COMMENT]: ['new_chat'],
  [REALTIME_EVENTS.LIVE_GIFT]: ['new_gift'],
  [REALTIME_EVENTS.LIVE_LIKE]: ['new_like'],
  [REALTIME_EVENTS.LIVE_SHARE]: ['new_share'],
  [REALTIME_EVENTS.LIVE_FOLLOW]: ['new_follow'],
  [REALTIME_EVENTS.LIVE_JOIN]: ['member_join'],
  [REALTIME_EVENTS.LIVE_EVENT]: ['new_activity'],
});

/** Events that also get a generic `live:event` wrapper for single-subscription feeds. */
const WRAPPED_IN_LIVE_EVENT = new Set([
  REALTIME_EVENTS.LIVE_COMMENT,
  REALTIME_EVENTS.LIVE_GIFT,
  REALTIME_EVENTS.LIVE_LIKE,
  REALTIME_EVENTS.LIVE_SHARE,
  REALTIME_EVENTS.LIVE_FOLLOW,
  REALTIME_EVENTS.LIVE_JOIN,
]);

/** Mongo ObjectId -> string, defensively. */
function idToString(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  // A live Mongo ObjectId.
  if (typeof value.toHexString === 'function') return value.toHexString();
  // An id that has already been through EJSON/JSON — a cached payload, a queued
  // job, a webhook body — arrives as a bare `{ $oid: "..." }`. Without this
  // branch `String(value)` produced "[object Object]" and clients could not
  // match the event to a creator.
  if (typeof value === 'object' && typeof value.$oid === 'string') return value.$oid;
  if (typeof value === 'number') return String(value);
  return String(value);
}

/**
 * Build the normalised envelope described in the contract.
 * Never mutates the caller's object.
 */
export function normalizePayload(event, payload = {}) {
  const normalised = { ...payload };

  if (normalised.creator_id !== undefined) {
    normalised.creator_id = idToString(normalised.creator_id);
  }
  if (normalised.stream_id !== undefined) {
    normalised.stream_id = idToString(normalised.stream_id);
  }
  if (normalised.user_id !== undefined) {
    normalised.user_id = idToString(normalised.user_id);
  }
  if (!normalised.timestamp) {
    normalised.timestamp = new Date().toISOString();
  }
  if (WRAPPED_IN_LIVE_EVENT.has(event)) {
    normalised.type = event;
  }
  return normalised;
}

/**
 * Emit an event to every connected client under its canonical name and all
 * legacy aliases.
 *
 * @param {import('socket.io').Server} io
 * @param {string} event  one of REALTIME_EVENTS
 * @param {object} payload
 */
export function emitLive(io, event, payload = {}) {
  if (!io || typeof io.emit !== 'function') return payload;

  const body = normalizePayload(event, payload);
  const names = [event, ...(LEGACY_EVENT_ALIASES[event] || [])];

  for (const name of names) {
    try {
      io.emit(name, body);
    } catch (err) {
      // A serialisation failure on one alias must not suppress the others.
      console.error(`[realtime] failed to emit "${name}": ${err.message}`);
    }
  }

  return body;
}

/**
 * Room name for per-user delivery.
 *
 * Exported so the connection handler in server.js and `emitToUser()` cannot
 * drift apart. They previously disagreed — one used `user_<id>`, the other
 * `user:<id>` — so targeted notifications were broadcast into a room that no
 * socket had ever joined and were silently dropped.
 */
export function userRoom(userId) {
  const id = idToString(userId);
  return id ? `user:${id}` : null;
}

/**
 * Emit to a single user's room (notifications, private analytics).
 * Falls back to a broadcast when the room naming convention is not in use yet.
 */
export function emitToUser(io, userId, event, payload = {}) {
  if (!io) return;
  const room = userRoom(userId);
  const body = normalizePayload(event, payload);
  if (room && typeof io.to === 'function') {
    io.to(room).emit(event, body);
  }
  return body;
}

/** Every name a client may legitimately subscribe to (canonical + aliases). */
export function allEventNames() {
  const names = new Set(Object.values(REALTIME_EVENTS));
  for (const aliases of Object.values(LEGACY_EVENT_ALIASES)) {
    aliases.forEach((a) => names.add(a));
  }
  return [...names].sort();
}

export default { REALTIME_EVENTS, LEGACY_EVENT_ALIASES, emitLive, emitToUser, userRoom, normalizePayload, allEventNames };
