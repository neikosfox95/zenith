import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, BACKEND_URL, mediaUrl } from '../config/backend';
import { AUTH_TOKEN_KEY, getTokenSync, hydrateToken } from './authToken';

// FIX: `process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001'` could
// never resolve from a browser — in Expo web the bundle runs in the user's
// browser, so "localhost" is *their* machine. The base URL now comes from
// src/config/backend.ts, which uses same-origin relative URLs on web (proxied
// by the dev server) and the configured host on native.
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

void hydrateToken();

// Add auth token to requests.
// Synchronous read from the shared in-memory mirror instead of hitting
// AsyncStorage on every request (which serialised all outgoing calls behind an
// async storage read and raced concurrent requests).
api.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const token = getTokenSync();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Surface a normalised error shape so screens can stop guessing between
// `err.response?.data?.error`, `err.response?.data?.error?.message` and
// `err.message`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    error.apiMessage =
      payload?.error?.message ||
      (typeof payload?.error === 'string' ? payload.error : null) ||
      payload?.message ||
      (status === 503
        ? 'Backend dependency unavailable — the API is up but its database is not.'
        : error.message);
    error.apiStatus = status ?? 0;
    error.apiCode = payload?.error?.code || payload?.code || null;
    return Promise.reject(error);
  }
);

export { api as axiosInstance, API_BASE, BACKEND_URL, mediaUrl, AUTH_TOKEN_KEY, AsyncStorage };

function normalizeCreatorDoc(c: any) {
  if (!c || typeof c !== 'object') return c;
  const id = String(c.id ?? c._id ?? c.creator_id ?? '');
  const tiktok_username = c.tiktok_username || c.username || '';
  return {
    ...c,
    id,
    _id: c._id ?? id,
    tiktok_username,
    username: c.username || tiktok_username,
    is_live: Boolean(c.is_live),
    viewer_count: Number(c.viewer_count ?? c.current_viewers ?? 0) || 0,
  };
}

function extractCreatorsPayload(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.creators)) return payload.creators;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export const creatorsAPI = {
  addCreator: async (tiktokUsername: string) => {
    const response = await api.post('/creators', { tiktok_username: tiktokUsername });
    return normalizeCreatorDoc(response.data?.creator ?? response.data);
  },
  getCreators: async () => {
    // Prefer the authenticated, user-scoped list. Fall back to the legacy
    // /creators/list path for older deployments that still expose it.
    try {
      const response = await api.get('/creators');
      const creators = extractCreatorsPayload(response.data);
      return creators.map(normalizeCreatorDoc);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const response = await api.get('/creators/list');
        const creators = extractCreatorsPayload(response.data);
        return creators.map(normalizeCreatorDoc);
      }
      throw err;
    }
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
    // FIX: referenced a local `API_URL` that no longer exists. Video/audio
    // `src` attributes need a resolvable URL, so this goes through mediaUrl()
    // which prefixes the backend host on native and stays same-origin on web.
    return mediaUrl(`/api/streams/${streamId}/video`);
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

function unwrapAnalyticsPayload(payload: any, nestedKeys: string[] = []) {
  if (payload == null) return payload;
  let out = payload;
  for (const key of nestedKeys) {
    if (out && typeof out === 'object' && out[key] != null && typeof out[key] === 'object') {
      out = { ...out, ...out[key] };
    }
  }
  return out;
}

export const analyticsAPI = {
  // User-scoped overall summary (authenticated).
  getSummary: async () => {
    const response = await api.get('/analytics/summary');
    return unwrapAnalyticsPayload(response.data, ['summary']);
  },
  // User-scoped live counters (authenticated).
  getRealtimeStats: async () => {
    const response = await api.get('/analytics/realtime');
    return unwrapAnalyticsPayload(response.data, ['realtime']);
  },
  getTopGifters: async (limit: number = 10) => {
    const response = await api.get(`/analytics/top-gifters?limit=${limit}`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.topGifters || data?.data || [];
  },
  getRevenueHistory: async (days: number = 7) => {
    const response = await api.get(`/analytics/revenue-history?days=${days}`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.history || data?.data || [];
  },
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
  getCoinAnalytics: async (creatorId: string, period: 'all' | 'today' | 'week' | 'month' = 'all') => {
    const response = await api.get(`/creators/${creatorId}/coins?period=${period}`);
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
