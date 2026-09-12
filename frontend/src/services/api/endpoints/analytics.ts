import apiClient from '../apiClient';
import { AnalyticsSummary, TopGifter, RevenueData } from '../../../stores/analyticsStore';

export const analyticsAPI = {
  // Get overall analytics summary
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get('/analytics/summary');
    return response.data || response;
  },

  // Get top gifters
  getTopGifters: async (limit: number = 10): Promise<TopGifter[]> => {
    const response = await apiClient.get('/analytics/top-gifters', { params: { limit } });
    return response.data || response;
  },

  // Get revenue history
  getRevenueHistory: async (days: number = 30): Promise<RevenueData[]> => {
    const response = await apiClient.get('/analytics/revenue-history', { params: { days } });
    return response.data || response;
  },

  // Get creator-specific analytics
  getCreatorAnalytics: async (creatorId: string): Promise<any> => {
    return apiClient.get(`/analytics/creator/${creatorId}`);
  },

  // Get real-time stats
  getRealtimeStats: async (): Promise<any> => {
    return apiClient.get('/analytics/realtime');
  },
};
