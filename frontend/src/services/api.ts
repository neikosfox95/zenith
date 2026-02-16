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

export default api;
