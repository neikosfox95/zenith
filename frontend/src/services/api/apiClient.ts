import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class APIClient {
  private client: AxiosInstance;
  private requestCache: Map<string, { data: any; timestamp: number }>;
  private pendingRequests: Map<string, Promise<any>>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add request ID for tracing
        config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Retry logic for network errors (3 attempts with exponential backoff)
        if (!originalRequest._retry && this.isRetryableError(error)) {
          originalRequest._retry = true;
          
          const retryCount = (originalRequest as any)._retryCount || 0;
          if (retryCount < 3) {
            (originalRequest as any)._retryCount = retryCount + 1;
            
            // Exponential backoff: 1s, 2s, 4s
            await this.delay(1000 * Math.pow(2, retryCount));
            
            return this.client(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private isRetryableError(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.requestCache.delete(key);
    return null;
  }

  private setCache(key: string, data: any) {
    this.requestCache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size to 100 entries
    if (this.requestCache.size > 100) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
    }
  }

  public setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // GET with caching and deduplication
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.getCacheKey({ method: 'GET', url, ...config });
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }
    
    // Make new request
    const promise = this.client.get<T>(url, config).then((response) => {
      this.setCache(cacheKey, response.data);
      this.pendingRequests.delete(cacheKey);
      return response.data;
    }).catch((error) => {
      this.pendingRequests.delete(cacheKey);
      throw error;
    });
    
    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    
    // Invalidate related GET caches
    this.invalidateCache(url);
    
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    this.invalidateCache(url);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    this.invalidateCache(url);
    return response.data;
  }

  private invalidateCache(url: string) {
    // Remove all cached entries that match the URL pattern
    const keysToDelete: string[] = [];
    this.requestCache.forEach((_, key) => {
      if (key.includes(url)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }

  public clearCache() {
    this.requestCache.clear();
  }
}

export const apiClient = new APIClient();
export default apiClient;
