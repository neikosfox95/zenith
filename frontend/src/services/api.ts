import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const creatorsAPI = {
  addCreator: async (tiktokUsername: string) => {
    const response = await api.post('/creators', { tiktok_username: tiktokUsername });
    return response.data;
  },
  getCreators: async () => {
    const response = await api.get('/creators');
    return response.data;
  },
  deleteCreator: async (creatorId: string) => {
    const response = await api.delete(`/creators/${creatorId}`);
    return response.data;
  },
};

export const streamsAPI = {
  getStreams: async () => {
    const response = await api.get('/streams');
    return response.data;
  },
  getStream: async (streamId: string) => {
    const response = await api.get(`/streams/${streamId}`);
    return response.data;
  },
  getGifts: async (streamId: string) => {
    const response = await api.get(`/streams/${streamId}/gifts`);
    return response.data;
  },
  getChats: async (streamId: string) => {
    const response = await api.get(`/streams/${streamId}/chats`);
    return response.data;
  },
  getVideoUrl: (streamId: string) => {
    return `${API_URL}/api/streams/${streamId}/video`;
  },
};

export const fansAPI = {
  getFans: async (creatorId: string, tier?: string, sortBy?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (tier) params.append('tier', tier);
    if (sortBy) params.append('sortBy', sortBy);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/creators/${creatorId}/fans?${params.toString()}`);
    return response.data;
  },
  getSuperFans: async (creatorId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/creators/${creatorId}/superfans${params}`);
    return response.data;
  },
  getFanDetails: async (username: string, creatorId: string) => {
    const response = await api.get(`/fans/${username}?creatorId=${creatorId}`);
    return response.data;
  },
  getFanClubStats: async (creatorId: string) => {
    const response = await api.get(`/creators/${creatorId}/fanclub/stats`);
    return response.data;
  },
  getLeaderboard: async (creatorId: string, type: 'diamonds' | 'gifts' | 'chats' = 'diamonds', limit?: number) => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/creators/${creatorId}/leaderboard?${params.toString()}`);
    return response.data;
  },
  getBadges: async () => {
    const response = await api.get('/badges');
    return response.data;
  },
};

export const analyticsAPI = {
  getStreamAnalytics: async (streamId: string) => {
    const response = await api.get(`/streams/${streamId}/analytics`);
    return response.data;
  },
  getActivityFeed: async (limit?: number, type?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (type) params.append('type', type);
    
    const response = await api.get(`/activity?${params.toString()}`);
    return response.data;
  },
  getStreamMilestones: async (streamId: string) => {
    const response = await api.get(`/streams/${streamId}/milestones`);
    return response.data;
  },
  getCreatorMilestones: async (creatorId: string) => {
    const response = await api.get(`/creators/${creatorId}/milestones`);
    return response.data;
  },
  getFollowerGrowth: async (creatorId: string, days?: number) => {
    const params = days ? `?days=${days}` : '';
    const response = await api.get(`/creators/${creatorId}/follower-growth${params}`);
    return response.data;
  },
  getRevenueAnalytics: async (creatorId: string, period: 'all' | 'today' | 'week' | 'month' = 'all') => {
    const response = await api.get(`/creators/${creatorId}/revenue?period=${period}`);
    return response.data;
  },
  getChatAnalytics: async (streamId: string) => {
    const response = await api.get(`/streams/${streamId}/chat-analytics`);
    return response.data;
  },
  getHistoricalData: async (creatorId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/creators/${creatorId}/historical${params}`);
    return response.data;
  },
};

export default api;
