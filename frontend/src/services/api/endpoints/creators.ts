import apiClient from '../apiClient';
import { Creator } from '../../../stores/creatorsStore';

export interface CreateCreatorPayload {
  tiktok_username: string;
}

/**
 * Normalise a creator document from the backend into the shape the store
 * expects. The API returns Mongo `_id` and a paginated `{ data, pagination }`
 * envelope; the store keys creators by `id` and screens read
 * `tiktok_username`.
 */
export function normalizeCreator(raw: any): Creator {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      tiktok_username: '',
      display_name: '',
      follower_count: 0,
      is_live: false,
    };
  }

  const id = String(raw.id ?? raw._id ?? raw.creator_id ?? '');
  const username = String(
    raw.tiktok_username ?? raw.username ?? raw.uniqueId ?? raw.display_name ?? ''
  );

  return {
    id,
    tiktok_username: username,
    display_name: String(raw.display_name ?? raw.nickname ?? username),
    follower_count: Number(raw.follower_count ?? raw.followers ?? 0) || 0,
    is_live: Boolean(raw.is_live ?? raw.live ?? false),
    avatar_url: raw.avatar_url ?? raw.avatar ?? undefined,
    bio: raw.bio ?? undefined,
    last_live_at: raw.last_live_at
      ? typeof raw.last_live_at === 'string'
        ? raw.last_live_at
        : new Date(raw.last_live_at).toISOString()
      : undefined,
    total_streams: raw.total_streams != null ? Number(raw.total_streams) : undefined,
    total_revenue: raw.total_revenue != null ? Number(raw.total_revenue) : undefined,
    viewer_count: Number(raw.viewer_count ?? raw.current_viewers ?? 0) || 0,
    peak_viewers: raw.peak_viewers != null ? Number(raw.peak_viewers) : undefined,
    like_count: raw.like_count != null ? Number(raw.like_count) : undefined,
    stream_title: raw.stream_title ?? undefined,
    updated_at: raw.updated_at
      ? typeof raw.updated_at === 'string'
        ? raw.updated_at
        : new Date(raw.updated_at).toISOString()
      : undefined,
  };
}

/** Extract an array of creator docs from paginated / bare / nested responses. */
export function extractCreatorList(response: any): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.creators)) return response.creators;
  if (Array.isArray(response.items)) return response.items;
  if (response.data && Array.isArray(response.data.data)) return response.data.data;
  if (response.data && Array.isArray(response.data.creators)) return response.data.creators;
  return [];
}

export const creatorsAPI = {
  // Get all creators (user-scoped). Handles paginated envelopes + `_id`.
  getAll: async (): Promise<Creator[]> => {
    const response = await apiClient.get('/creators');
    return extractCreatorList(response).map(normalizeCreator);
  },

  // Get single creator
  getById: async (id: string): Promise<Creator> => {
    const response = await apiClient.get(`/creators/${id}`);
    const raw = (response as any)?.data ?? response;
    return normalizeCreator(raw?.creator ?? raw);
  },

  // Add new creator to tracking
  create: async (payload: CreateCreatorPayload): Promise<Creator> => {
    const response = await apiClient.post('/creators', payload);
    const raw = (response as any)?.data ?? response;
    return normalizeCreator(raw?.creator ?? raw);
  },

  // Remove creator from tracking
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/creators/${id}`);
  },

  // Get creator statistics
  getStats: async (id: string): Promise<any> => {
    return apiClient.get(`/creators/${id}/stats`);
  },
};
