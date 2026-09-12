/**
 * ============================================================
 * GOD TIER CUSTOM HOOKS LIBRARY
 * ============================================================
 * Production-grade React hooks for enterprise applications
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Keyboard, AppState, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { cacheManager, performanceMonitor } from '../utils/GodTierFramework';

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
  // FIX: React 19's useRef type requires an explicit initial argument;
  // `useRef<T>()` no longer compiles.
  const ref = useRef<T | undefined>(undefined);

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
/**
 * FIXES (this hook is the offline-cache backbone of every God Tier screen, so
 * its type signature leaking was responsible for most of the app's remaining
 * type errors):
 *
 *  1. INFERENCE. `useLocalStorage<T>(key, initialValue: T)` inferred `T` from
 *     the default value, so `useLocalStorage('k', null)` produced `T = null`
 *     and the setter's type became `(val: null) => null` — a *function* — which
 *     is why `setCachedSummary(summary)` failed with "Argument of type
 *     AnalyticsSummary is not assignable to parameter of type (val: null) =>
 *     null", and why reading `cachedSummary.status` reported
 *     "Property does not exist on type never". Likewise `useLocalStorage('k', [])`
 *     inferred `never[]`.
 *
 *     `D` (the default's type) is now a separate parameter from `T` (the
 *     stored value's type), and an explicit `T` always wins.
 *
 *  2. STALE CLOSURE. The updater form read `storedValue` from the render
 *     closure, so two `setValue(prev => …)` calls in the same tick both
 *     computed from the same base and the first write was lost. It now uses
 *     React's functional setState.
 *
 *  3. MISSING useCallback. `setValue` was recreated on every render and is in
 *     the dependency array of effects across the app, causing those effects to
 *     re-run (and re-fetch) on every render.
 *
 *  4. THE CACHED VALUE WAS NEVER TYPED. `cacheManager.get()` returns `any` and
 *     was assigned straight into state, so a corrupt or foreign cache entry
 *     under the same key would land in the UI unchecked.
 */
/**
 * Type parameters are ordered `<D, T = D>` — the *default value's* type comes
 * first because it is the one TypeScript can infer, and `T` (the type you
 * actually store) defaults to it.
 *
 * That ordering gives both call styles correct behaviour:
 *
 *   useLocalStorage('flag', true)                 -> D = T = boolean
 *   useLocalStorage<Summary | null>('k', null)    -> D = null, T = Summary | null
 *
 * With the more obvious `<T, D>` ordering, `useLocalStorage('k', null)` infers
 * `T = null` and the setter becomes `(val: null) => null` — which is the bug
 * that made every offline cache in the app fail to type-check.
 */
export function useLocalStorage<D, T = D>(
  key: string,
  initialValue: D
): [T | D, (value: T | D | ((prev: T | D) => T | D)) => Promise<void>, boolean] {
  type Stored = T | D;

  const [storedValue, setStoredValue] = useState<Stored>(initialValue as Stored);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const cached = (await cacheManager.get(key)) as Stored | null | undefined;
        // `null` and `undefined` both mean "cache miss" — but `false` and `0`
        // are legitimate stored values and must not be discarded.
        if (!cancelled && cached !== null && cached !== undefined) {
          setStoredValue(cached);
        }
      } catch (error) {
        console.error(`[useLocalStorage] error loading "${key}":`, error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Mirror of the current value so an updater function can be resolved
  // *synchronously*. React may defer (or in StrictMode double-invoke) a
  // functional setState callback, so reading the result back out of it would
  // race the cache write below.
  const valueRef = useRef<Stored>(initialValue as Stored);
  valueRef.current = storedValue;

  const setValue = useCallback(
    async (value: Stored | ((prev: Stored) => Stored)) => {
      const resolved = (
        typeof value === 'function'
          ? (value as (prev: Stored) => Stored)(valueRef.current)
          : value
      ) as Stored;

      valueRef.current = resolved;
      setStoredValue(resolved);

      try {
        await cacheManager.set(key, resolved, 86400000); // 24h
      } catch (error) {
        // Persistence is best-effort; the in-memory state is already updated.
        console.error(`[useLocalStorage] error saving "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue, loading];
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
