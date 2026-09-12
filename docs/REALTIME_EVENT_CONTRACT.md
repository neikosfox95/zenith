# Realtime Event Contract

**This is the single source of truth for Socket.IO event names and payloads.**

Machine-readable versions live beside the code that uses them:

- Backend: `backend/lib/realtime-events.js`
- Frontend: `frontend/src/realtime/events.ts`

Both must stay in sync with this table. If you add an event, add it in all three.

---

## Why this file exists

The backend and the frontend were developed against two different, invented
event vocabularies and **not one name matched**:

| Backend emitted          | Frontend listened for       | Result |
|--------------------------|-----------------------------|--------|
| `creator_live`           | `creator:status`            | never fired |
| `creator_offline`        | `stream:ended`              | never fired |
| `viewer_update`          | `creator:viewers`           | never fired |
| `new_gift`               | `live:gift`                 | never fired |
| `new_chat`               | `live:comment`              | never fired |
| `new_like`               | `live:like`                 | never fired |
| `new_share`              | `live:share`                | never fired |
| `new_follow`             | `live:follow`               | never fired |
| `member_join`            | `live:join`                 | never fired |
| `badge_earned`           | `badge_earned`              | ✅ matched |
| `fan_tier_upgrade`       | `fan_tier_upgrade`          | ✅ matched |
| —                        | `analytics:delta` / `:full` / `:viewers` | backend never emitted |
| —                        | `live:event` / `live:batch` | backend never emitted |

So the socket connected successfully, `connected` went `true`, the UI showed a
green "live" indicator — and then nothing ever arrived. Every screen that
depended on realtime data silently fell back to its mock/empty state, which is
why the PRD records "dashboard realtime hooks are mocked" as a known issue. It
was not a missing feature; it was a naming mismatch.

The backend now emits **both** the canonical name and the legacy name for every
live event, so existing consumers keep working while the frontend migrates.

---

## Canonical events

### Stream lifecycle

#### `stream:started`
Emitted when a monitored creator goes live.

```jsonc
{
  "creator_id": "665f1c2e8b0a4f2c1d3e4f50",  // Mongo ObjectId as string
  "tiktok_username": "darkskully",
  "stream_id": "7391234567890123456",
  "title": "late night chat",
  "viewer_count": 0,
  "started_at": "2026-09-12T01:00:00.000Z"
}
```

#### `stream:ended`
```jsonc
{
  "creator_id": "665f1c2e8b0a4f2c1d3e4f50",
  "tiktok_username": "darkskully",
  "stream_id": "7391234567890123456",
  "viewer_count": 0,
  "ended_at": "2026-09-12T03:00:00.000Z"
}
```

### Creator status

#### `creator:status`
Delta update — only the fields present have changed.

```jsonc
{
  "creator_id": "665f1c2e8b0a4f2c1d3e4f50",
  "tiktok_username": "darkskully",
  "is_live": true,
  "viewer_count": 1284,
  "stream_title": "late night chat",
  "stream_id": "7391234567890123456",
  "updated_at": "2026-09-12T01:05:00.000Z"
}
```

#### `creator:viewers`
High-frequency (throttled server-side). Keep the payload minimal.

```jsonc
{
  "creator_id": "665f1c2e8b0a4f2c1d3e4f50",
  "stream_id": "7391234567890123456",
  "viewer_count": 1284
}
```

### Live interactions

All of these share the same envelope:

```jsonc
{
  "creator_id": "665f1c2e8b0a4f2c1d3e4f50",
  "stream_id": "7391234567890123456",
  "user_id": "7123456789012345678",   // TikTok uid, string
  "username": "viewerhandle",          // TikTok uniqueId
  "nickname": "Viewer Name",
  "timestamp": "2026-09-12T01:05:00.000Z"
}
```

| Event          | Extra fields |
|----------------|--------------|
| `live:comment` | `text`, `emotes[]` |
| `live:gift`    | `gift_name`, `gift_id`, `repeat_count`, `diamonds`, `coins`, `group_id` |
| `live:like`    | `count`, `total` |
| `live:share`   | `count` |
| `live:follow`  | — |
| `live:join`    | — |

> **`live:gift` must carry `creator_id`.** The legacy `new_gift` payload spread
> the raw connector gift object plus `stream_id` only, so a client could not
> attribute a gift to a creator without a second round-trip.

#### `live:batch`
Coalesced interaction events, emitted at most once per second per stream.
Prefer subscribing to this over the individual events for firehose UIs.

```jsonc
{
  "creator_id": "…",
  "stream_id": "…",
  "window_ms": 1000,
  "events": [ /* array of the envelopes above, each with its own `type` */ ],
  "counts": { "comment": 12, "gift": 3, "like": 40, "share": 1, "follow": 2, "join": 5 }
}
```

#### `live:event`
Generic wrapper emitted alongside every specific event, carrying
`{ type, ...payload }`. Useful for a single-subscription activity feed.

### Analytics

#### `analytics:delta`
Incremental metric change.

```jsonc
{
  "creator_id": "…",
  "stream_id": "…",
  "metrics": { "viewers": 1284, "likes": 90210, "gifts": 44, "diamonds": 12000, "shares": 31 },
  "timestamp": "2026-09-12T01:05:00.000Z"
}
```

#### `analytics:full`
Full snapshot, sent on subscribe and every 60s.

#### `analytics:viewers`
Viewer-count time series point: `{ creator_id, stream_id, viewer_count, timestamp }`.

### Engagement

| Event | Payload |
|-------|---------|
| `badge_earned` | `{ creator_id, user_id, username, badge_id, badge_name, tier }` |
| `fan_tier_upgrade` | `{ creator_id, user_id, username, from_tier, to_tier, total_diamonds }` |
| `milestone_achieved` | `{ creator_id, stream_id, metric, value, threshold }` |
| `gift_combo_milestone` | `{ creator_id, username, gift_name, combo_count }` |
| `gift_streak_milestone` | `{ creator_id, username, streak_days }` |
| `treasure_box_opened` | `{ creator_id, stream_id, user_id, reward }` |
| `clip_created` | `{ creator_id, stream_id, clip_id, url }` |
| `notification` | `{ user_id, title, body, data }` (sent to a user room, not broadcast) |

---

## Conventions

1. **Names are `domain:action`, lower-case, colon-separated.** The legacy
   snake_case names (`new_gift`, `creator_live`) are still emitted for
   compatibility but must not be used by new code.
2. **IDs are strings.** Mongo `ObjectId` and TikTok uid are both serialised to
   strings; clients must not assume numeric.
3. **`creator_id` is present on every event that relates to a creator.** The
   store keys on `id`, so hooks resolve `creator_id ?? id` defensively.
4. **Timestamps are ISO-8601 UTC.**
5. **Payloads are additive.** Adding a field is not a breaking change; renaming
   or removing one is — bump the event name instead.
6. **Do not put secrets, tokens, or full user documents in a broadcast.**
   `io.emit` reaches every connected client.

## Client-side rules

- Always `socket.off(event, handler)` with **the same handler reference**.
  Calling `socket.off('stream:started')` with no handler removes *every*
  listener for that event, including ones registered by other hooks.
- Debounce or batch high-frequency events (`creator:viewers`, `live:like`)
  before touching React state.
