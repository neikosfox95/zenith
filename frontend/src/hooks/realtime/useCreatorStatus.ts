import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useCreatorsStore } from '../../stores/creatorsStore';

export interface CreatorStatus {
  creator_id: string;
  is_live: boolean;
  viewer_count: number;
  stream_title?: string;
}

export const useCreatorStatus = () => {
  const { socket, connected } = useSocket();
  const { updateCreator, creators } = useCreatorsStore();
  const [liveCreators, setLiveCreators] = useState<string[]>([]);

  // Debounced update to prevent UI thrashing
  const debouncedUpdate = useCallback((creatorId: string, updates: any) => {
    // Use setTimeout to debounce rapid updates
    const timer = setTimeout(() => {
      updateCreator(creatorId, updates);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [updateCreator]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Handle creator status updates (delta updates)
    const handleStatusUpdate = (data: CreatorStatus) => {
      const { creator_id, is_live, viewer_count, stream_title } = data;
      
      // Update store with delta
      updateCreator(creator_id, {
        is_live,
        ...(viewer_count !== undefined && { viewer_count }),
        ...(stream_title !== undefined && { stream_title }),
        ...(is_live && { last_live_at: new Date().toISOString() }),
      });
      
      // Track live creators
      setLiveCreators(prev => {
        if (is_live && !prev.includes(creator_id)) {
          return [...prev, creator_id];
        } else if (!is_live) {
          return prev.filter(id => id !== creator_id);
        }
        return prev;
      });
    };

    // Handle viewer count updates (high frequency)
    const handleViewerUpdate = (data: { creator_id: string; viewer_count: number }) => {
      updateCreator(data.creator_id, { viewer_count: data.viewer_count });
    };

    // Subscribe to events
    socket.on('creator:status', handleStatusUpdate);
    socket.on('creator:viewers', handleViewerUpdate);
    
    // Stream lifecycle events
    socket.on('stream:started', (data: any) => {
      if (data.creator_id) {
        handleStatusUpdate({
          creator_id: data.creator_id,
          is_live: true,
          viewer_count: data.viewer_count || 0,
          stream_title: data.title,
        });
      }
    });
    
    socket.on('stream:ended', (data: any) => {
      if (data.creator_id) {
        handleStatusUpdate({
          creator_id: data.creator_id,
          is_live: false,
          viewer_count: 0,
        });
      }
    });

    return () => {
      socket.off('creator:status', handleStatusUpdate);
      socket.off('creator:viewers', handleViewerUpdate);
      socket.off('stream:started');
      socket.off('stream:ended');
    };
  }, [socket, connected, updateCreator]);

  return {
    liveCreators,
    isConnected: connected,
    totalLive: liveCreators.length,
  };
};
