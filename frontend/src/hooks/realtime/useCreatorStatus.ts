import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useCreatorsStore } from '../../stores/creatorsStore';
import {
  REALTIME_EVENTS,
  creatorIdFrom,
  type CreatorStatusPayload,
  type CreatorViewersPayload,
  type StreamStartedPayload,
  type StreamEndedPayload,
} from '../../realtime/events';

export interface CreatorStatus {
  creator_id: string;
  is_live: boolean;
  viewer_count?: number;
  stream_title?: string;
}

/**
 * Live status + viewer counters for every tracked creator.
 *
 * Fixed in this pass:
 *
 *  1. EVENT NAMES. Subscribed to `creator:status` / `creator:viewers` /
 *     `stream:started` / `stream:ended` while the server emitted
 *     `creator_live` / `viewer_update` / `creator_offline`. None matched, so
 *     this hook never received a single event and `liveCreators` stayed empty
 *     forever. It now subscribes through the shared contract, which the server
 *     emits under both the canonical and legacy names.
 *
 *  2. THE DEBOUNCE DID NOTHING. `debouncedUpdate` created a fresh timer on
 *     every call and returned a cleanup function that no caller ever invoked,
 *     so every event fired an update — the exact re-render storm the comment
 *     said it was preventing — while leaking a timer per event. Replaced with
 *     a real trailing debounce that keeps one timer per creator.
 *
 *  3. IDENTITY. The store keys creators by `id`; the socket payload carries
 *     `creator_id` (and the legacy gift payload carried neither). Updates are
 *     now resolved through `creatorIdFrom()` and skipped when unresolvable
 *     instead of silently writing to a non-existent record.
 *
 *  4. LISTENER CLEANUP. `socket.off('stream:started')` with no handler removes
 *     *every* listener for that event, including ones other hooks registered.
 *     Now passes the exact handler reference.
 */

/** Viewer updates arrive many times per second; coalesce them per creator. */
const VIEWER_DEBOUNCE_MS = 500;

export const useCreatorStatus = () => {
  const { socket, connected } = useSocket();
  const updateCreator = useCreatorsStore((state) => state.updateCreator);
  const [liveCreators, setLiveCreators] = useState<string[]>([]);

  // Per-creator trailing debounce state.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, Partial<CreatorStatusPayload>>());

  const flushCreator = useCallback(
    (creatorId: string) => {
      const updates = pending.current.get(creatorId);
      timers.current.delete(creatorId);
      pending.current.delete(creatorId);
      if (!updates) return;
      updateCreator(creatorId, { ...updates, updated_at: new Date().toISOString() });
    },
    [updateCreator]
  );

  /** Queue an update for `creatorId`, coalescing bursts into one store write. */
  const queueUpdate = useCallback(
    (creatorId: string, updates: Partial<CreatorStatusPayload>, immediate = false) => {
      const existing = pending.current.get(creatorId) ?? {};
      pending.current.set(creatorId, { ...existing, ...updates });

      if (immediate) {
        const timer = timers.current.get(creatorId);
        if (timer) clearTimeout(timer);
        flushCreator(creatorId);
        return;
      }

      const existingTimer = timers.current.get(creatorId);
      if (existingTimer) clearTimeout(existingTimer);
      timers.current.set(
        creatorId,
        setTimeout(() => flushCreator(creatorId), VIEWER_DEBOUNCE_MS)
      );
    },
    [flushCreator]
  );

  const trackLive = useCallback((creatorId: string, isLive: boolean) => {
    setLiveCreators((prev) => {
      if (isLive && !prev.includes(creatorId)) return [...prev, creatorId];
      if (!isLive && prev.includes(creatorId)) return prev.filter((id) => id !== creatorId);
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    // Capture the ref *values* now. Reading `timers.current` inside the cleanup
    // would resolve whatever the ref points at when cleanup runs, which may be a
    // different Set after a re-render.
    const timerSet = timers.current;
    const pendingMap = pending.current;

    const handleStatusUpdate = (data: CreatorStatusPayload) => {
      const creatorId = creatorIdFrom(data);
      if (!creatorId) return;

      const updates: Partial<CreatorStatusPayload> = {};
      if (data.is_live !== undefined) updates.is_live = data.is_live;
      if (data.viewer_count !== undefined) updates.viewer_count = data.viewer_count;
      if (data.stream_title !== undefined) updates.stream_title = data.stream_title;
      if (data.is_live) updates.last_live_at = new Date().toISOString();

      // A live/offline transition must not be delayed by the debounce, or the
      // UI shows a creator as offline for up to half a second after they go live.
      queueUpdate(creatorId, updates, data.is_live !== undefined);
      if (data.is_live !== undefined) trackLive(creatorId, data.is_live);
    };

    const handleViewerUpdate = (data: CreatorViewersPayload) => {
      const creatorId = creatorIdFrom(data);
      if (!creatorId || typeof data.viewer_count !== 'number') return;
      // High frequency: always coalesce.
      queueUpdate(creatorId, { viewer_count: data.viewer_count });
    };

    const handleStreamStarted = (data: StreamStartedPayload) => {
      const creatorId = creatorIdFrom(data);
      if (!creatorId) return;
      queueUpdate(
        creatorId,
        {
          is_live: true,
          viewer_count: data.viewer_count ?? 0,
          stream_title: data.title,
          last_live_at: new Date().toISOString(),
        },
        true
      );
      trackLive(creatorId, true);
    };

    const handleStreamEnded = (data: StreamEndedPayload) => {
      const creatorId = creatorIdFrom(data);
      if (!creatorId) return;
      queueUpdate(creatorId, { is_live: false, viewer_count: 0 }, true);
      trackLive(creatorId, false);
    };

    socket.on(REALTIME_EVENTS.CREATOR_STATUS, handleStatusUpdate);
    socket.on(REALTIME_EVENTS.CREATOR_VIEWERS, handleViewerUpdate);
    socket.on(REALTIME_EVENTS.STREAM_STARTED, handleStreamStarted);
    socket.on(REALTIME_EVENTS.STREAM_ENDED, handleStreamEnded);

    return () => {
      // Pass the handler reference: `socket.off(name)` with no handler would
      // remove every listener for that event, including other hooks'.
      socket.off(REALTIME_EVENTS.CREATOR_STATUS, handleStatusUpdate);
      socket.off(REALTIME_EVENTS.CREATOR_VIEWERS, handleViewerUpdate);
      socket.off(REALTIME_EVENTS.STREAM_STARTED, handleStreamStarted);
      socket.off(REALTIME_EVENTS.STREAM_ENDED, handleStreamEnded);

      // Drop any queued-but-unflushed updates and their timers.
      timerSet.forEach((timer) => clearTimeout(timer));
      timerSet.clear();
      pendingMap.clear();
    };
  }, [socket, connected, queueUpdate, trackLive]);

  return {
    liveCreators,
    isConnected: connected,
    totalLive: liveCreators.length,
  };
};

export default useCreatorStatus;
