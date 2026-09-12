/**
 * ============================================================
 * AUTH TOKEN STORE
 * ============================================================
 *
 * The token used to be read from AsyncStorage in exactly one place
 * (`src/services/api.ts`). The other HTTP client —
 * `src/services/api/apiClient.ts` — never attached an Authorization header at
 * all, so every screen built on it received a 401 from the API. That is the
 * "creators-enhanced shows an empty state / /api/creators returns 401" bug
 * recorded in memory/PRD.md.
 *
 * This module is the single accessor. It keeps an in-memory mirror so the
 * (synchronous) axios request interceptor does not have to await AsyncStorage
 * on every call, which also removes a race where two concurrent requests could
 * both read a stale token.
 *
 * The storage key stays `auth_token` so sessions created before this change
 * keep working.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user';

let cachedToken: string | null = null;
let hydration: Promise<void> | null = null;

/** Synchronous read for interceptors. Returns null until hydrated. */
export function getTokenSync(): string | null {
  return cachedToken;
}

/** Load the persisted token into memory once. Safe to call repeatedly. */
export function hydrateToken(): Promise<void> {
  if (!hydration) {
    hydration = (async () => {
      try {
        cachedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      } catch {
        cachedToken = null;
      }
    })();
  }
  return hydration;
}

export async function getToken(): Promise<string | null> {
  await hydrateToken();
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Persistence is best-effort; the in-memory copy still works this session.
  }
}

export async function clearToken(): Promise<void> {
  await setToken(null);
}

/** `Bearer …` header value, or undefined when signed out. */
export function authHeader(token: string | null = cachedToken): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Warm the cache as early as possible so the first request after a cold start
// is already authenticated.
void hydrateToken();
