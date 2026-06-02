import { useState, useEffect } from 'react';

export interface DashboardStats {
  total_viewers: number;
  live_now: number;
  total_revenue: number;
  total_gifts: number;
  total_streams: number;
}

export interface Creator {
  username: string;
  is_live: boolean;
  viewer_count: number;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_viewers: 0,
    live_now: 0,
    total_revenue: 0,
    total_gifts: 0,
    total_streams: 1,
  });

  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    // Mock data for now - will be replaced with real API calls
    setStats({
      total_viewers: 12547,
      live_now: 3,
      total_revenue: 45678,
      total_gifts: 234,
      total_streams: 15,
    });

    setCreators([
      { username: 'creator1', is_live: true, viewer_count: 5234 },
      { username: 'creator2', is_live: false, viewer_count: 0 },
      { username: 'creator3', is_live: true, viewer_count: 3421 },
    ]);
  }, []);

  return { stats, creators };
}
