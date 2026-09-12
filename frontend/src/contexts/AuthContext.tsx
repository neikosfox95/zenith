import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/backend';
import {
  AUTH_TOKEN_KEY,
  USER_KEY,
  hydrateToken,
  setToken as persistToken,
} from '../services/authToken';

/**
 * ============================================================
 * AUTH CONTEXT
 * ============================================================
 * Fixed in this pass:
 *
 *  1. Base URL — was a private `Constants.expoConfig?.extra?.… ||
 *     'http://localhost:8001'` copy. In Expo web that points at the viewer's
 *     own machine, so login/register could never succeed in the browser
 *     preview. Now sourced from src/config/backend.ts (same-origin on web).
 *
 *  2. Token propagation — this context wrote the token to AsyncStorage, but
 *     `src/services/api/apiClient.ts` kept its own in-memory default header
 *     that nothing ever updated, so every screen built on that client stayed
 *     anonymous and got 401s. Both now go through services/authToken.ts, and
 *     writing the token here updates the shared mirror immediately.
 *
 *  3. Error messages — the backend returns
 *     `{ error: { message, code } }` for middleware-level failures and
 *     `{ error: 'string' }` for handler-level ones. The old code only read the
 *     string form, so users saw "Login failed" with no reason. Both are read
 *     now, and a 503 is explained as a backend dependency being down rather
 *     than blamed on the user's password.
 *
 *  4. `loading` — was only cleared by loadStoredAuth(); if that threw before
 *     the finally block the app hung on the splash state.
 */

const API_URL = BACKEND_URL;

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  /** True once a token is present — handy for gating realtime features. */
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Pull a human-readable message out of either backend error shape. */
function describeAuthError(error: any, fallback: string): string {
  const status: number | undefined = error?.response?.status;
  const data = error?.response?.data;
  const raw = data?.error?.message ?? (typeof data?.error === 'string' ? data.error : null) ?? data?.message;

  if (status === 503) {
    return 'The server is up but its database is not reachable yet. Try again in a moment.';
  }
  if (status === 429) {
    return 'Too many attempts. Please wait before trying again.';
  }
  if (!error?.response && error?.code === 'ECONNABORTED') {
    return 'The request timed out. Check your connection and try again.';
  }
  if (!error?.response) {
    return `Cannot reach the server${API_URL ? ` at ${API_URL}` : ''}. Is the backend running?`;
  }
  return raw || fallback;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /** Persist + mirror the token so every HTTP client picks it up at once. */
  const applyToken = useCallback(async (next: string | null) => {
    setTokenState(next);
    await persistToken(next);
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      await hydrateToken();
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setTokenState(storedToken);
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch {
          // Corrupt persisted user object: drop both so we start clean instead
          // of sitting in a half-authenticated state forever.
          await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
          await persistToken(null);
        }
      } else if (storedToken && !storedUser) {
        // Token without a user profile is not usable — clear it.
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await persistToken(null);
      }
    } catch (error) {
      console.warn('[auth] could not restore session:', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStoredAuth();
  }, [loadStoredAuth]);

  // Attach the token to *any* axios instance in the app (screens that create
  // their own client still get authenticated).
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  const persistUser = async (userData: User) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.warn('[auth] could not persist user profile:', (error as Error).message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/login`, { email, password });
      const { token: authToken, user: userData } = response.data ?? {};

      if (!authToken) {
        throw new Error('The server did not return an authentication token.');
      }

      await applyToken(authToken);
      if (userData) await persistUser(userData);
    } catch (error: any) {
      throw new Error(describeAuthError(error, 'Login failed'));
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/register`, {
        email,
        username,
        password,
      });
      const { token: authToken, user: userData } = response.data ?? {};

      if (!authToken) {
        throw new Error('The server did not return an authentication token.');
      }

      await applyToken(authToken);
      if (userData) await persistUser(userData);
    } catch (error: any) {
      throw new Error(describeAuthError(error, 'Registration failed'));
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.warn('[auth] error clearing storage:', (error as Error).message);
    } finally {
      // Always clear the in-memory state, even if storage failed.
      await persistToken(null);
      setTokenState(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User, AuthContextType };
