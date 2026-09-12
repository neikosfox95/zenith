import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../../services/api/endpoints/analytics';
import { creatorsAPI } from '../../services/api/endpoints/creators';

export interface DashboardStats {
  total_viewers: number;
  live_now: number;
  total_revenue: number;
  total_gifts: number;
  total_streams: number;
  peak_viewers?: number;
  current_viewers?: number;
  revenue_change_pct?: number;
  revenue_trend?: string;
}

export interface Creator {
  id?: string;
  username: string;
  is_live: boolean;
  viewer_count: number;
}

const EMPTY_STATS: DashboardStats = {
  total_viewers: 0,
  live_now: 0,
  total_revenue: 0,
  total_gifts: 0,
  total_streams: 0,
  peak_viewers: 0,
  current_viewers: 0,
  revenue_change_pct: 0,
  revenue_trend: 'flat',
};

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, realtime, creatorList] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getRealtimeStats().catch(() => null),
        creatorsAPI.getAll().catch(() => []),
      ]);

      setStats({
        total_viewers:
          realtime?.current_viewers ??
          summary.current_viewers ??
          summary.total_viewers ??
          0,
        live_now: realtime?.live_streams ?? summary.live_streams ?? 0,
        total_revenue: summary.total_revenue ?? 0,
        total_gifts: summary.total_gifts ?? 0,
        total_streams: summary.total_streams ?? 0,
        peak_viewers: Math.max(
          Number(summary.peak_viewers || 0),
          Number(realtime?.peak_viewers || 0)
        ),
        current_viewers:
          realtime?.current_viewers ?? summary.current_viewers ?? 0,
        revenue_change_pct: summary.revenue_change_pct ?? 0,
        revenue_trend: summary.revenue_trend ?? 'flat',
      });

      setCreators(
        (creatorList || []).map((c: {
          id?: string;
          tiktok_username?: string;
          display_name?: string;
          is_live?: boolean;
          viewer_count?: number;
        }) => ({
          id: c.id,
          username: c.tiktok_username || c.display_name || '',
          is_live: Boolean(c.is_live),
          viewer_count: Number(c.viewer_count || 0) || 0,
        }))
      );
    } catch (err: any) {
      console.error('Failed to load dashboard analytics:', err);
      setError(err?.apiMessage || err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return { stats, creators, loading, error, refresh };
}
