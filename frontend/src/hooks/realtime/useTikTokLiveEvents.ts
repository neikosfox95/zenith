import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLiveEventsStore, type LiveEvent } from '../../stores/liveEventsStore';
import { REALTIME_EVENTS, creatorIdFrom, type BaseEventPayload } from '../../realtime/events';

interface BatchUpdate {
  events: LiveEvent[];
  timestamp?: number;
}

/** Socket event name -> the `event_type` stored in the feed. */
const EVENT_TYPE_BY_NAME: Record<string, string> = {
  [REALTIME_EVENTS.LIVE_COMMENT]: 'comment',
  [REALTIME_EVENTS.LIVE_GIFT]: 'gift',
  [REALTIME_EVENTS.LIVE_LIKE]: 'like',
  [REALTIME_EVENTS.LIVE_SHARE]: 'share',
  [REALTIME_EVENTS.LIVE_FOLLOW]: 'follow',
  [REALTIME_EVENTS.LIVE_JOIN]: 'join',
  [REALTIME_EVENTS.STREAM_STARTED]: 'stream_started',
  [REALTIME_EVENTS.STREAM_ENDED]: 'stream_ended',
};

let localSeq = 0;

/**
 * Convert a raw socket payload into the LiveEvent shape the store expects.
 *
 * FIX: the raw payload was pushed straight into the feed, but it has no `id`,
 * no `event_type` and no `created_at` — those are store fields, not wire
 * fields. Every row in the live feed therefore rendered with an undefined key
 * (React duplicate-key warnings) and an undefined type (so the per-type
 * filters matched nothing).
 */
function toLiveEvent(eventName: string, payload: BaseEventPayload & Record<string, unknown>): LiveEvent {
  localSeq = (localSeq + 1) % Number.MAX_SAFE_INTEGER;
  return {
    id: `${eventName}-${payload.timestamp ?? Date.now()}-${localSeq}`,
    stream_id: typeof payload.stream_id === 'string' ? payload.stream_id : '',
    event_type: EVENT_TYPE_BY_NAME[eventName] ?? eventName.replace(/^live:/, ''),
    payload,
    created_at: payload.timestamp ?? new Date().toISOString(),
    creator_username:
      (payload.tiktok_username as string | undefined) ??
      (payload.creator_username as string | undefined) ??
      creatorIdFrom(payload),
  };
}

export const useTikTokLiveEvents = () => {
  const { socket, connected } = useSocket();
  const { addEvents, setConnected, events } = useLiveEventsStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Batching state
  const batchBuffer = useRef<LiveEvent[]>([]);
  // FIX: `NodeJS.Timeout` — React Native's setTimeout returns a number, so the
  // event-batching timer never type-checked. Without batching working, every
  // gift/comment/like event triggered its own re-render.
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BATCH_INTERVAL = 200; // 200ms batching interval

  // Flush batch to store
  const flushBatch = useCallback(() => {
    if (batchBuffer.current.length > 0) {
      addEvents(batchBuffer.current);
      batchBuffer.current = [];
    }
  }, [addEvents]);

  /**
   * Add an event to the batch.
   *
   * FIX: this was a *debounce* — it cleared and re-armed the timer on every
   * event. On a busy stream (likes and comments arrive many times per second)
   * the timer was reset before it could ever fire, so the buffer grew without
   * bound and the feed never updated until the socket disconnected. It is now
   * a throttle: the first event in a quiet period arms the flush, and later
   * events just join the buffer.
   */
  const batchEvent = useCallback((event: LiveEvent) => {
    batchBuffer.current.push(event);
    if (batchTimer.current !== null) return;
    batchTimer.current = setTimeout(() => {
      batchTimer.current = null;
      flushBatch();
    }, BATCH_INTERVAL);
  }, [flushBatch]);

  useEffect(() => {
    if (!socket || !connected) {
      setConnected(false);
      setIsSubscribed(false);
      return;
    }

    setConnected(true);

    // One handler per event name so each can be normalised with its own type,
    // and so `socket.off` can be given the exact reference it registered.
    const makeHandler = (eventName: string) => (payload: BaseEventPayload & Record<string, unknown>) => {
      batchEvent(toLiveEvent(eventName, payload ?? {}));
    };

    const handleBatchUpdate = (batch: BatchUpdate) => {
      if (!batch?.events?.length) return;
      // The server may send already-shaped LiveEvents or raw wire payloads.
      const normalised = batch.events.map((event) =>
        event && event.id && event.event_type
          ? event
          : toLiveEvent(
              (event as { type?: string }).type ?? REALTIME_EVENTS.LIVE_EVENT,
              event as unknown as BaseEventPayload & Record<string, unknown>
            )
      );
      addEvents(normalised);
    };

    const subscriptions: [string, (payload: never) => void][] = [
      [REALTIME_EVENTS.LIVE_EVENT, makeHandler(REALTIME_EVENTS.LIVE_EVENT)],
      [REALTIME_EVENTS.LIVE_COMMENT, makeHandler(REALTIME_EVENTS.LIVE_COMMENT)],
      [REALTIME_EVENTS.LIVE_GIFT, makeHandler(REALTIME_EVENTS.LIVE_GIFT)],
      [REALTIME_EVENTS.LIVE_LIKE, makeHandler(REALTIME_EVENTS.LIVE_LIKE)],
      [REALTIME_EVENTS.LIVE_SHARE, makeHandler(REALTIME_EVENTS.LIVE_SHARE)],
      [REALTIME_EVENTS.LIVE_FOLLOW, makeHandler(REALTIME_EVENTS.LIVE_FOLLOW)],
      [REALTIME_EVENTS.LIVE_JOIN, makeHandler(REALTIME_EVENTS.LIVE_JOIN)],
      [REALTIME_EVENTS.STREAM_STARTED, makeHandler(REALTIME_EVENTS.STREAM_STARTED)],
      [REALTIME_EVENTS.STREAM_ENDED, makeHandler(REALTIME_EVENTS.STREAM_ENDED)],
    ];

    for (const [eventName, handler] of subscriptions) {
      socket.on(eventName, handler as (payload: unknown) => void);
    }
    socket.on(REALTIME_EVENTS.LIVE_BATCH, handleBatchUpdate as (payload: unknown) => void);

    setIsSubscribed(true);

    return () => {
      // FIX: `socket.off('stream:started')` with no handler removed *every*
      // listener for that event, including the ones useCreatorStatus registers.
      // Whichever hook unmounted first silently killed the other's realtime
      // updates. Every off() now passes the exact handler it registered.
      for (const [eventName, handler] of subscriptions) {
        socket.off(eventName, handler as (payload: unknown) => void);
      }
      socket.off(REALTIME_EVENTS.LIVE_BATCH, handleBatchUpdate as (payload: unknown) => void);

      // Flush whatever is still buffered so the last events are not dropped.
      if (batchTimer.current !== null) {
        clearTimeout(batchTimer.current);
        batchTimer.current = null;
      }
      flushBatch();

      setIsSubscribed(false);
    };
  }, [socket, connected, batchEvent, addEvents, flushBatch, setConnected]);

  return {
    events,
    isConnected: connected,
    isSubscribed,
  };
};
