import apiClient from '../apiClient';
import { AnalyticsSummary, TopGifter, RevenueData } from '../../../stores/analyticsStore';

/** Pull the useful payload out of several historical response shapes. */
function unwrap<T>(response: any, nestedKeys: string[] = []): T {
  if (response == null) return response as T;
  // apiClient.get already returns response.data
  let payload = response?.data !== undefined && !Array.isArray(response) && typeof response.data === 'object'
    ? response.data
    : response;
  for (const key of nestedKeys) {
    if (payload && typeof payload === 'object' && key in payload && payload[key] != null) {
      // Prefer nested object when it looks like the real payload
      if (typeof payload[key] === 'object') {
        payload = { ...payload, ...payload[key] };
      }
    }
  }
  return payload as T;
}

export const analyticsAPI = {
  // Get overall analytics summary (user-scoped, authenticated)
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get('/analytics/summary');
    return unwrap<AnalyticsSummary>(response, ['summary']);
  },

  // Get top gifters
  getTopGifters: async (limit: number = 10): Promise<TopGifter[]> => {
    const response = await apiClient.get('/analytics/top-gifters', { params: { limit } });
    const payload = unwrap<any>(response);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.topGifters)) return payload.topGifters;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },

  // Get revenue history
  getRevenueHistory: async (days: number = 30): Promise<RevenueData[]> => {
    const response = await apiClient.get('/analytics/revenue-history', { params: { days } });
    const payload = unwrap<any>(response);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.history)) return payload.history;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },

  // Get creator-specific analytics
  getCreatorAnalytics: async (creatorId: string): Promise<any> => {
    return apiClient.get(`/analytics/creator/${creatorId}`);
  },

  // Get real-time stats (user-scoped, authenticated)
  getRealtimeStats: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/realtime');
    return unwrap<any>(response, ['realtime']);
  },
};
