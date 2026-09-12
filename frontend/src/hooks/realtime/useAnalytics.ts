import { useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAnalyticsStore } from '../../stores/analyticsStore';

interface AnalyticsDelta {
  total_revenue?: number;
  total_gifts?: number;
  total_viewers?: number;
  peak_viewers?: number;
}

export const useAnalytics = () => {
  const { socket, connected } = useSocket();
  const { summary, updateSummaryDelta, setSummary } = useAnalyticsStore();

  useEffect(() => {
    if (!socket || !connected) return;

    // Handle delta updates (only changed fields)
    const handleDeltaUpdate = (delta: AnalyticsDelta) => {
      updateSummaryDelta(delta);
    };

    // Handle full summary updates (less frequent)
    const handleFullUpdate = (fullSummary: any) => {
      setSummary(fullSummary);
    };

    // Handle real-time gift
    const handleGiftReceived = (data: any) => {
      // Increment counters
      updateSummaryDelta({
        total_gifts: summary.total_gifts + 1,
        total_revenue: summary.total_revenue + (data.diamond_value || 0),
      });
    };

    // Handle viewer updates
    const handleViewerUpdate = (data: { viewer_count: number; is_peak?: boolean }) => {
      updateSummaryDelta({
        total_viewers: data.viewer_count,
        ...(data.is_peak && { peak_viewers: data.viewer_count }),
      });
    };

    // Subscribe to analytics events
    socket.on('analytics:delta', handleDeltaUpdate);
    socket.on('analytics:full', handleFullUpdate);
    socket.on('live:gift', handleGiftReceived);
    socket.on('analytics:viewers', handleViewerUpdate);

    return () => {
      socket.off('analytics:delta', handleDeltaUpdate);
      socket.off('analytics:full', handleFullUpdate);
      socket.off('live:gift', handleGiftReceived);
      socket.off('analytics:viewers', handleViewerUpdate);
    };
  }, [socket, connected, updateSummaryDelta, setSummary, summary]);

  return {
    summary,
    isConnected: connected,
  };
};
