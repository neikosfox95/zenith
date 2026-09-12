/**
 * ============================================================
 * BACKEND CONFIGURATION — single source of truth
 * ============================================================
 *
 * Before this file existed there were six different copies of the same
 * decision, and they disagreed with each other:
 *
 *   src/services/api.ts            process.env.EXPO_PUBLIC_BACKEND_URL
 *   src/services/api/apiClient.ts  Constants.expoConfig?.extra?.…
 *   src/contexts/AuthContext.tsx   Constants.expoConfig?.extra?.…
 *   src/contexts/SocketContext.tsx process.env.…
 *   app/(tabs)/code.tsx            Constants.expoConfig?.extra?.…
 *   app/(tabs)/voice.tsx           Constants.expoConfig?.extra?.…
 *
 * All six fell back to `http://localhost:8001`. That fallback is wrong in
 * every environment that matters:
 *
 *   • Expo **web** runs in the user's browser, where "localhost" is the
 *     user's own machine — not the dev server. Every request failed, and
 *     mixed-content/CORS errors followed.
 *   • A physical **Android/iOS** device also has its own localhost.
 *
 * Resolution order implemented here:
 *   1. EXPO_PUBLIC_BACKEND_URL (inlined at build time by babel/metro, or read
 *      from expoConfig.extra at runtime).
 *   2. On web: '' (same-origin relative URLs) so requests go to whatever host
 *      served the bundle and are proxied to the API by the dev server. This is
 *      what makes the browser preview work.
 *   3. On native: http://localhost:8001 for a simulator, otherwise the
 *      developer machine's LAN address if EXPO_PUBLIC_LAN_IP is provided.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ExpoExtra = Record<string, unknown> | undefined;

function readExtra(): ExpoExtra {
  // `expoConfig` is present in dev; `manifest` in published builds. Either can
  // be undefined during the very first render, so both are guarded.
  const extra =
    (Constants.expoConfig?.extra as ExpoExtra) ??
    ((Constants.manifest?.extra as ExpoExtra) || undefined);
  return extra;
}

function readEnv(): string | undefined {
  // `process.env.EXPO_PUBLIC_*` is statically replaced by the babel plugin at
  // build time. Guard the whole access because `process` does not exist on
  // every runtime.
  try {
    const value = (process as unknown as { env?: Record<string, string | undefined> })?.env
      ?.EXPO_PUBLIC_BACKEND_URL;
    return value && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveBaseUrl(): string {
  const explicit = stripTrailingSlash(readEnv() ?? '');
  if (explicit) return explicit;

  // app.json declares `extra.EXPO_PUBLIC_BACKEND_URL` as an empty string on
  // purpose: it documents that the knob exists, and an empty value means "use
  // the platform default below" rather than "point at an empty host".
  const fromExtra = readExtra()?.EXPO_PUBLIC_BACKEND_URL;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return stripTrailingSlash(fromExtra.trim());
  }

  if (Platform.OS === 'web') {
    // Same-origin: the dev server proxies /api and /socket.io to the backend
    // (see metro.config.js), and a production web build is served by the same
    // host as the API. No hardcoded host, no CORS, no mixed content.
    return '';
  }

  const lanIp = readExtra()?.EXPO_PUBLIC_LAN_IP;
  if (typeof lanIp === 'string' && lanIp.trim().length > 0) {
    return `http://${lanIp.trim()}:8001`;
  }

  // Emulator/simulator on the same machine as the API.
  return 'http://localhost:8001';
}

/** Base URL of the backend, without a trailing slash. May be '' on web. */
export const BACKEND_URL = resolveBaseUrl();

/** e.g. '/api' (web, proxied) or 'http://10.0.0.5:8001/api' (native). */
export const API_BASE = `${BACKEND_URL}/api`;

/** Socket.IO endpoint. Must be absolute — socket.io-client cannot use ''. */
export const SOCKET_URL =
  BACKEND_URL ||
  (Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:8001');

/** Absolute URL for a media path returned by the API (e.g. '/uploads/x.png'). */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const backendConfig = {
  baseUrl: BACKEND_URL,
  apiBase: API_BASE,
  socketUrl: SOCKET_URL,
  isSameOrigin: BACKEND_URL === '',
  platform: Platform.OS,
  mediaUrl,
};

export default backendConfig;
