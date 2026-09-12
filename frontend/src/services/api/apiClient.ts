import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE } from '../../config/backend';
import { getTokenSync, hydrateToken } from '../authToken';

// FIX: this file used to `import { useAuth } from '../../contexts/AuthContext'`
// and never use it. That was (a) an unused React hook import in a non-component
// module and (b) a circular import — AuthContext pulls in the API layer, so
// depending on module evaluation order one of the two resolved to `undefined`
// at import time. Removed.
//
// FIX: the base URL is now resolved by src/config/backend.ts instead of a
// private copy of `Constants.expoConfig?.extra?.… || 'http://localhost:8001'`,
// which could never work from a browser (the browser's localhost is the user's
// own machine, not the dev server).

class APIClient {
  private client: AxiosInstance;
  private requestCache: Map<string, { data: any; timestamp: number }>;
  private pendingRequests: Map<string, Promise<any>>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_MAX_ENTRIES = 100;

  constructor() {
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Warm the token cache so the first request of a cold start is
    // authenticated rather than racing AsyncStorage.
    void hydrateToken();

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add request ID for tracing
        config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        // FIX: the Authorization header was never attached. `setAuthToken()`
        // existed but nothing ever called it (AuthContext persists to
        // AsyncStorage instead), so every request from this client was
        // anonymous and every protected endpoint answered 401.
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

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
          _retryCount?: number;
        };

        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Retry with exponential backoff (1s, 2s, 4s) — see isRetryableError
        // for what qualifies.
        const retryCount = originalRequest._retryCount ?? 0;
        if (!originalRequest._retry && retryCount < 3 && this.isRetryableError(error)) {
          originalRequest._retry = true;
          originalRequest._retryCount = retryCount + 1;

          // Honour Retry-After when the server sent one (rate limits), so we do
          // not hammer a limiter that just told us to back off.
          const retryAfter = error.response?.headers?.['retry-after'];
          const serverDelay = retryAfter ? Number(retryAfter) * 1000 : NaN;
          const backoff = Number.isFinite(serverDelay)
            ? serverDelay
            : 1000 * Math.pow(2, retryCount);

          await this.delay(backoff);
          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private isRetryableError(error: AxiosError): boolean {
    const method = (error.config?.method || 'get').toLowerCase();

    // FIX: only idempotent methods are safe to replay. The previous version
    // retried *everything* on any network error or 5xx, so a POST /creators
    // that timed out after the server had already committed would create a
    // duplicate on retry.
    const idempotent = ['get', 'head', 'options', 'put', 'delete'].includes(method);
    if (!idempotent) return false;

    // No response at all: connection reset / timeout / DNS. Safe to retry.
    if (!error.response) return true;

    const status = error.response.status;

    // 503 is "the database is down" or "rate limited" — retrying immediately
    // makes both worse. Respect Retry-After instead (handled above) and only
    // for genuine upstream failures.
    if (status === 503) return false;

    return status >= 500 && status < 600;
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
    
    // Limit cache size to 100 entries.
    // FIX: `keys().next().value` is `string | undefined` under strict mode, and
    // Map eviction is insertion-order, not LRU — a long-lived entry can now be
    // evicted while a hot one stays. Bounded, which is what matters here.
    while (this.requestCache.size > this.CACHE_MAX_ENTRIES) {
      const oldestKey = this.requestCache.keys().next().value;
      if (oldestKey === undefined) break;
      this.requestCache.delete(oldestKey);
    }
  }

  /**
   * Kept for backwards compatibility. The request interceptor now reads the
   * shared token store on every request, so calling this is optional — but it
   * still sets the default header for any code path that bypasses the
   * interceptor (e.g. a manually constructed request config).
   */
  public setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
    // Cached GET responses were fetched under a different identity.
    this.clearCache();
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
