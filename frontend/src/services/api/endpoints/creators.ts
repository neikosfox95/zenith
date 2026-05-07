import apiClient from './apiClient';
import { Creator } from '../../stores/creatorsStore';

export interface CreateCreatorPayload {
  tiktok_username: string;
}

export const creatorsAPI = {
  // Get all creators
  getAll: async (): Promise<Creator[]> => {
    return apiClient.get('/creators');
  },

  // Get single creator
  getById: async (id: string): Promise<Creator> => {
    return apiClient.get(`/creators/${id}`);
  },

  // Add new creator to tracking
  create: async (payload: CreateCreatorPayload): Promise<Creator> => {
    return apiClient.post('/creators', payload);
  },

  // Remove creator from tracking
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/creators/${id}`);
  },

  // Get creator statistics
  getStats: async (id: string): Promise<any> => {
    return apiClient.get(`/creators/${id}/stats`);
  },
};
