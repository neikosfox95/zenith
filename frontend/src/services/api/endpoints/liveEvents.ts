import apiClient from '../apiClient';
import { LiveEvent } from '../../../stores/liveEventsStore';

export interface LiveEventsResponse {
  events: LiveEvent[];
  hasMore: boolean;
  nextCursor?: string;
}

export const liveEventsAPI = {
  // Get recent live events
  getRecent: async (limit: number = 50, cursor?: string): Promise<LiveEventsResponse> => {
    const response = await apiClient.get('/live-events', { 
      params: { limit, cursor } 
    });
    return response.data || response;
  },

  // Get events for specific creator
  getByCreator: async (creatorId: string, limit: number = 50): Promise<LiveEvent[]> => {
    const response = await apiClient.get(`/live-events/creator/${creatorId}`, { 
      params: { limit } 
    });
    return response.data || response;
  },

  // Get events by type
  getByType: async (eventType: string, limit: number = 50): Promise<LiveEvent[]> => {
    const response = await apiClient.get(`/live-events/type/${eventType}`, { 
      params: { limit } 
    });
    return response.data || response;
  },
};
