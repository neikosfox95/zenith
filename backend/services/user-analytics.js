// ============================================================
// USER-SCOPED ANALYTICS AGGREGATION
// ------------------------------------------------------------
// Powers GET /api/analytics/summary and /api/analytics/realtime.
// All numbers are derived from the creators the requesting user
// actually owns (via `user_creators`) — never global platform data.
// ============================================================

import { ObjectId } from '../lib/db.js';

const MS_DAY = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;

/** Coerce a user id claim into an ObjectId when possible. */
export function toObjectId(value) {
  if (value instanceof ObjectId) return value;
  if (value && typeof value === 'object' && value._id) return toObjectId(value._id);
  const str = String(value ?? '');
  if (ObjectId.isValid(str) && String(new ObjectId(str)) === str) {
    return new ObjectId(str);
  }
  return str;
}

/**
 * Resolve the set of creator ObjectIds linked to a user.
 * Returns [] when the user has no creators (empty dashboard, not an error).
 */
export async function getUserCreatorIds(db, userId) {
  const uid = toObjectId(userId);
  const links = await db
    .collection('user_creators')
    .find({ user_id: uid })
    .project({ creator_id: 1 })
    .toArray();

  // Also accept string user_id for fixtures that store plain strings.
  if (links.length === 0 && uid instanceof ObjectId) {
    const alt = await db
      .collection('user_creators')
      .find({ user_id: String(userId) })
      .project({ creator_id: 1 })
      .toArray();
    return alt.map((l) => l.creator_id).filter(Boolean);
  }

  return links.map((l) => l.creator_id).filter(Boolean);
}

function emptyGiftAgg() {
  return { total_revenue: 0, total_gifts: 0 };
}

function sumGiftDocs(docs) {
  let total_revenue = 0;
  let total_gifts = 0;
  for (const g of docs) {
    total_gifts += 1;
    total_revenue += Number(g.total_value ?? g.diamond_count ?? g.diamonds ?? 0) || 0;
  }
  return { total_revenue, total_gifts };
}

/**
 * Aggregate gift totals for a set of creators, optionally within a time window.
 * Prefers Mongo aggregation when available; falls back to a find + reduce so
 * the in-process fake DB used in tests still works.
 */
async function aggregateGifts(db, creatorIds, { since, until } = {}) {
  if (!creatorIds.length) return emptyGiftAgg();

  const match = { creator_id: { $in: creatorIds } };
  if (since || until) {
    match.timestamp = {};
    if (since) match.timestamp.$gte = since;
    if (until) match.timestamp.$lt = until;
  }

  const coll = db.collection('gifts');

  // Prefer aggregation when the driver supports it.
  if (typeof coll.aggregate === 'function') {
    try {
      const rows = await coll
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total_revenue: {
                $sum: {
                  $ifNull: ['$total_value', { $ifNull: ['$diamond_count', 0] }],
                },
              },
              total_gifts: { $sum: 1 },
            },
          },
        ])
        .toArray();
      if (rows[0]) {
        return {
          total_revenue: rows[0].total_revenue || 0,
          total_gifts: rows[0].total_gifts || 0,
        };
      }
      return emptyGiftAgg();
    } catch {
      // Fall through to find-based path (fake DB).
    }
  }

  const docs = await coll.find(match).toArray();
  // Manual time filter for fakes that ignore nested match operators.
  const filtered = docs.filter((g) => {
    if (!since && !until) return true;
    const ts = g.timestamp ? new Date(g.timestamp).getTime() : 0;
    if (since && ts < since.getTime()) return false;
    if (until && ts >= until.getTime()) return false;
    return true;
  });
  return sumGiftDocs(filtered);
}

function streamDurationMinutes(stream) {
  const start = stream.start_time || stream.started_at;
  if (!start) return 0;
  const end = stream.end_time || stream.ended_at || (stream.status === 'live' ? new Date() : null);
  if (!end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / 1000 / 60);
}

function isLiveStream(stream) {
  return stream.status === 'live' || stream.is_live === true;
}

/**
 * Build the analytics summary for a user's owned creators.
 */
export async function buildAnalyticsSummary(db, userId) {
  const creatorIds = await getUserCreatorIds(db, userId);
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - PERIOD_DAYS * MS_DAY);
  const previousPeriodStart = new Date(now.getTime() - 2 * PERIOD_DAYS * MS_DAY);

  if (!creatorIds.length) {
    return {
      total_revenue: 0,
      total_gifts: 0,
      total_viewers: 0,
      peak_viewers: 0,
      average_duration: 0,
      total_streams: 0,
      current_viewers: 0,
      live_streams: 0,
      live_gifts: 0,
      live_revenue: 0,
      owned_creators: 0,
      period_days: PERIOD_DAYS,
      current_period: {
        start: currentPeriodStart.toISOString(),
        end: now.toISOString(),
        revenue: 0,
        gifts: 0,
      },
      previous_period: {
        start: previousPeriodStart.toISOString(),
        end: currentPeriodStart.toISOString(),
        revenue: 0,
        gifts: 0,
      },
      revenue_change_pct: 0,
      revenue_trend: 'flat',
    };
  }

  const [allGifts, currentPeriodGifts, previousPeriodGifts, streams, creators] =
    await Promise.all([
      aggregateGifts(db, creatorIds),
      aggregateGifts(db, creatorIds, { since: currentPeriodStart, until: now }),
      aggregateGifts(db, creatorIds, {
        since: previousPeriodStart,
        until: currentPeriodStart,
      }),
      db
        .collection('live_streams')
        .find({ creator_id: { $in: creatorIds } })
        .toArray(),
      db
        .collection('creators')
        .find({ _id: { $in: creatorIds } })
        .toArray(),
    ]);

  // Manual creator_id filter for fakes that don't honour $in.
  const ownedStreams = streams.filter((s) =>
    creatorIds.some((id) => String(id) === String(s.creator_id))
  );
  const ownedCreators = creators.filter((c) =>
    creatorIds.some((id) => String(id) === String(c._id))
  );

  let peak_viewers = 0;
  let total_viewers = 0;
  let durationSum = 0;
  let durationCount = 0;
  let live_streams = 0;
  let current_viewers = 0;

  for (const stream of ownedStreams) {
    const peak = Number(stream.peak_viewers || 0) || 0;
    const viewers = Number(stream.total_viewers ?? stream.viewer_count ?? 0) || 0;
    if (peak > peak_viewers) peak_viewers = peak;
    total_viewers += viewers;

    const mins = streamDurationMinutes(stream);
    if (mins > 0) {
      durationSum += mins;
      durationCount += 1;
    }

    if (isLiveStream(stream)) {
      live_streams += 1;
      current_viewers += Number(
        stream.total_viewers ?? stream.viewer_count ?? stream.current_viewers ?? 0
      ) || 0;
    }
  }

  // Prefer live creator.current_viewers when streams don't carry the counter.
  if (current_viewers === 0) {
    for (const c of ownedCreators) {
      if (c.is_live) {
        current_viewers += Number(c.current_viewers ?? c.viewer_count ?? 0) || 0;
        if (!live_streams) live_streams += 1;
      }
    }
  }

  // Peak across creators if streams had no peaks.
  if (peak_viewers === 0) {
    for (const c of ownedCreators) {
      const p = Number(c.peak_viewers || 0) || 0;
      if (p > peak_viewers) peak_viewers = p;
    }
  }

  // Live gift totals — gifts on currently-live streams only.
  const liveStreamIds = ownedStreams
    .filter(isLiveStream)
    .map((s) => s._id)
    .filter(Boolean);

  let live_gifts = 0;
  let live_revenue = 0;
  if (liveStreamIds.length) {
    const liveGiftDocs = await db
      .collection('gifts')
      .find({ stream_id: { $in: liveStreamIds } })
      .toArray();
    const liveFiltered = liveGiftDocs.filter((g) =>
      liveStreamIds.some((id) => String(id) === String(g.stream_id))
    );
    const liveAgg = sumGiftDocs(liveFiltered);
    live_gifts = liveAgg.total_gifts;
    live_revenue = liveAgg.total_revenue;
  }

  const prevRev = previousPeriodGifts.total_revenue || 0;
  const currRev = currentPeriodGifts.total_revenue || 0;
  let revenue_change_pct = 0;
  let revenue_trend = 'flat';
  if (prevRev === 0 && currRev > 0) {
    revenue_change_pct = 100;
    revenue_trend = 'up';
  } else if (prevRev > 0) {
    revenue_change_pct = Math.round(((currRev - prevRev) / prevRev) * 1000) / 10;
    revenue_trend = revenue_change_pct > 0 ? 'up' : revenue_change_pct < 0 ? 'down' : 'flat';
  }

  return {
    total_revenue: allGifts.total_revenue,
    total_gifts: allGifts.total_gifts,
    total_viewers,
    peak_viewers,
    average_duration: durationCount ? Math.round(durationSum / durationCount) : 0,
    total_streams: ownedStreams.length,
    current_viewers,
    live_streams,
    live_gifts,
    live_revenue,
    owned_creators: creatorIds.length,
    period_days: PERIOD_DAYS,
    current_period: {
      start: currentPeriodStart.toISOString(),
      end: now.toISOString(),
      revenue: currRev,
      gifts: currentPeriodGifts.total_gifts,
    },
    previous_period: {
      start: previousPeriodStart.toISOString(),
      end: currentPeriodStart.toISOString(),
      revenue: prevRev,
      gifts: previousPeriodGifts.total_gifts,
    },
    revenue_change_pct,
    revenue_trend,
  };
}

/**
 * Lightweight realtime snapshot — live counts only, cheap to poll.
 */
export async function buildRealtimeAnalytics(db, userId) {
  const summary = await buildAnalyticsSummary(db, userId);
  return {
    current_viewers: summary.current_viewers,
    peak_viewers: summary.peak_viewers,
    live_streams: summary.live_streams,
    live_gifts: summary.live_gifts,
    live_revenue: summary.live_revenue,
    total_revenue: summary.total_revenue,
    total_gifts: summary.total_gifts,
    owned_creators: summary.owned_creators,
    updated_at: new Date().toISOString(),
  };
}

export default {
  getUserCreatorIds,
  buildAnalyticsSummary,
  buildRealtimeAnalytics,
  toObjectId,
};
