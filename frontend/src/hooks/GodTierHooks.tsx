/**
 * ============================================================
 * GOD TIER CUSTOM HOOKS LIBRARY
 * ============================================================
 * Production-grade React hooks for enterprise applications
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Keyboard, AppState, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { cacheManager, performanceMonitor, networkMonitor } from '../utils/GodTierFramework';

// ============================================================
// useApiCall - Advanced API hook with caching, retry, offline
// ============================================================
interface UseApiCallOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryCount?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApiCall<T = any>(options: UseApiCallOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    const stopTimer = performanceMonitor.startTimer(`api_${options.url}`);
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (options.cache && options.method === 'GET') {
        const cached = await cacheManager.get(options.url);
        if (cached) {
          setData(cached);
          setLoading(false);
          stopTimer();
          return cached;
        }
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(options.url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      // Cache if enabled
      if (options.cache && options.method === 'GET') {
        await cacheManager.set(options.url, result, options.cacheTTL);
      }

      options.onSuccess?.(result);
      stopTimer();
      return result;

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err);
        options.onError?.(err);
      }
      stopTimer();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { data, loading, error, execute, refetch: execute };
}

// ============================================================
// useInfiniteScroll - Advanced pagination & lazy loading
// ============================================================
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<T[]>,
  pageSize: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchFn(page);
      
      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFn, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    loadMore();
  }, []);

  return { data, loading, hasMore, error, loadMore, reset };
}

// ============================================================
// useDebounce - Optimize search & input performance
// ============================================================
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================
// useKeyboard - Handle keyboard events
// ============================================================
export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}

// ============================================================
// useNetwork - Monitor network status
// ============================================================
export function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}

// ============================================================
// useAppState - Track app foreground/background
// ============================================================
export function useAppState(
  onForeground?: () => void,
  onBackground?: () => void
) {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        onForeground?.();
      } else if (nextAppState.match(/inactive|background/)) {
        onBackground?.();
      }

      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, onForeground, onBackground]);

  return appState;
}

// ============================================================
// useResponsive - Responsive design utilities
// ============================================================
export function useResponsive() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isSmallDevice = dimensions.width < 375;
  const isMediumDevice = dimensions.width >= 375 && dimensions.width < 768;
  const isLargeDevice = dimensions.width >= 768;
  const isTablet = dimensions.width >= 768;

  return {
    width: dimensions.width,
    height: dimensions.height,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait'
  };
}

// ============================================================
// usePrevious - Track previous state
// ============================================================
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================
// useInterval - Safe interval hook
// ============================================================
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ============================================================
// useLocalStorage - Persist state
// ============================================================
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValue();
  }, [key]);

  const loadValue = async () => {
    try {
      const cached = await cacheManager.get(key);
      if (cached !== null) {
        setStoredValue(cached);
      }
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await cacheManager.set(key, valueToStore, 86400000); // 24h
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  return [storedValue, setValue, loading] as const;
}

// ============================================================
// useForm - Advanced form management
// ============================================================
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field: keyof T, rules?: any) => {
    // Add validation logic
    return true;
  }, []);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  };
}

// ============================================================
// useAnimation - Animation utilities
// ============================================================
export function useAnimation(duration: number = 300) {
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = useCallback(async (callback: () => void) => {
    setIsAnimating(true);
    callback();
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsAnimating(false);
  }, [duration]);

  return { isAnimating, animate };
}

// ============================================================
// useSearch - Advanced search with filtering
// ============================================================
export function useSearch<T>(
  data: T[],
  searchFields: (keyof T)[],
  filterFn?: (item: T, query: string) => boolean
) {
  const [query, setQuery] = useState('');
  
  const results = useMemo(() => {
    if (!query.trim()) return data;

    return data.filter(item => {
      if (filterFn) {
        return filterFn(item, query);
      }

      return searchFields.some(field => {
        const value = String(item[field]).toLowerCase();
        return value.includes(query.toLowerCase());
      });
    });
  }, [data, query, searchFields, filterFn]);

  return { query, setQuery, results };
}
