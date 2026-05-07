import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLiveEventsStore } from '../../stores/liveEventsStore';
import { LiveEvent } from '../../stores/liveEventsStore';

interface BatchUpdate {
  events: LiveEvent[];
  timestamp: number;
}

export const useTikTokLiveEvents = () => {
  const { socket, connected } = useSocket();
  const { addEvents, setConnected, events } = useLiveEventsStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Batching state
  const batchBuffer = useRef<LiveEvent[]>([]);
  const batchTimer = useRef<NodeJS.Timeout | null>(null);
  const BATCH_INTERVAL = 200; // 200ms batching interval

  // Flush batch to store
  const flushBatch = useCallback(() => {
    if (batchBuffer.current.length > 0) {
      addEvents(batchBuffer.current);
      batchBuffer.current = [];
    }
  }, [addEvents]);

  // Add event to batch
  const batchEvent = useCallback((event: LiveEvent) => {
    batchBuffer.current.push(event);
    
    // Clear existing timer
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }
    
    // Set new timer
    batchTimer.current = setTimeout(flushBatch, BATCH_INTERVAL);
  }, [flushBatch]);

  useEffect(() => {
    if (!socket || !connected) {
      setConnected(false);
      setIsSubscribed(false);
      return;
    }

    setConnected(true);

    // Subscribe to live events
    const handleLiveEvent = (event: LiveEvent) => {
      batchEvent(event);
    };

    const handleBatchUpdate = (batch: BatchUpdate) => {
      if (batch.events && batch.events.length > 0) {
        addEvents(batch.events);
      }
    };

    // Listen for individual events
    socket.on('live:event', handleLiveEvent);
    socket.on('live:gift', handleLiveEvent);
    socket.on('live:join', handleLiveEvent);
    socket.on('live:share', handleLiveEvent);
    socket.on('live:like', handleLiveEvent);
    socket.on('live:follow', handleLiveEvent);
    socket.on('live:comment', handleLiveEvent);
    
    // Listen for batch updates (delta updates from server)
    socket.on('live:batch', handleBatchUpdate);
    
    // Stream status updates
    socket.on('stream:started', (data: any) => {
      batchEvent({
        id: `stream-start-${Date.now()}`,
        stream_id: data.stream_id,
        event_type: 'stream_started',
        payload: data,
        created_at: new Date().toISOString(),
        creator_username: data.creator_username,
      });
    });
    
    socket.on('stream:ended', (data: any) => {
      batchEvent({
        id: `stream-end-${Date.now()}`,
        stream_id: data.stream_id,
        event_type: 'stream_ended',
        payload: data,
        created_at: new Date().toISOString(),
        creator_username: data.creator_username,
      });
    });

    setIsSubscribed(true);

    // Cleanup
    return () => {
      socket.off('live:event', handleLiveEvent);
      socket.off('live:gift', handleLiveEvent);
      socket.off('live:join', handleLiveEvent);
      socket.off('live:share', handleLiveEvent);
      socket.off('live:like', handleLiveEvent);
      socket.off('live:follow', handleLiveEvent);
      socket.off('live:comment', handleLiveEvent);
      socket.off('live:batch', handleBatchUpdate);
      socket.off('stream:started');
      socket.off('stream:ended');
      
      // Flush remaining batch
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
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
