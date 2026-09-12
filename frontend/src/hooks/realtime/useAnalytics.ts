import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAnalyticsStore, type AnalyticsSummary } from '../../stores/analyticsStore';
// Prefer the dedicated endpoints module so getSummary / getRealtimeStats
// resolve even if the legacy barrel in services/api.ts is the import target.
import { analyticsAPI } from '../../services/api/endpoints/analytics';

interface AnalyticsDelta {
  total_revenue?: number;
  total_gifts?: number;
  total_viewers?: number;
  peak_viewers?: number;
  current_viewers?: number;
}

const POLL_MS = 30_000;

export const useAnalytics = () => {
  const { socket, connected } = useSocket();
  const { summary, updateSummaryDelta, setSummary, setLoading } = useAnalyticsStore();
  const summaryRef = useRef(summary);
  summaryRef.current = summary;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, realtime] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getRealtimeStats().catch(() => null),
      ]);

      const merged: AnalyticsSummary = {
        ...summaryData,
        ...(realtime
          ? {
              current_viewers:
                realtime.current_viewers ?? summaryData.current_viewers,
              peak_viewers: Math.max(
                Number(summaryData.peak_viewers || 0),
                Number(realtime.peak_viewers || 0)
              ),
              live_streams: realtime.live_streams ?? summaryData.live_streams,
              live_gifts: realtime.live_gifts ?? summaryData.live_gifts,
              live_revenue: realtime.live_revenue ?? summaryData.live_revenue,
            }
          : {}),
      };
      setSummary(merged);
      return merged;
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      setLoading(false);
      return null;
    }
  }, [setSummary, setLoading]);

  // Initial load + periodic refresh so the screen is not socket-only.
  useEffect(() => {
    void fetchSummary();
    const timer = setInterval(() => {
      void fetchSummary();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchSummary]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleDeltaUpdate = (delta: AnalyticsDelta) => {
      updateSummaryDelta(delta);
    };

    const handleFullUpdate = (fullSummary: AnalyticsSummary) => {
      setSummary(fullSummary);
    };

    const handleGiftReceived = (data: any) => {
      const current = summaryRef.current;
      const diamonds = Number(
        data.diamond_value ?? data.diamonds ?? data.total_value ?? 0
      ) || 0;
      updateSummaryDelta({
        total_gifts: (current.total_gifts || 0) + 1,
        total_revenue: (current.total_revenue || 0) + diamonds,
        live_gifts: (current.live_gifts || 0) + 1,
        live_revenue: (current.live_revenue || 0) + diamonds,
      });
    };

    const handleViewerUpdate = (data: {
      viewer_count: number;
      is_peak?: boolean;
    }) => {
      updateSummaryDelta({
        current_viewers: data.viewer_count,
        total_viewers: data.viewer_count,
        ...(data.is_peak ? { peak_viewers: data.viewer_count } : {}),
      });
    };

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
  }, [socket, connected, updateSummaryDelta, setSummary]);

  return {
    summary,
    isConnected: connected,
    refresh: fetchSummary,
  };
};
