import { createContext, use, useState, useEffect, type ReactNode } from 'react';
import { UserProfile } from '../types/workout';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import { StorageService } from '../services/storageService';

export interface DuoRegisterPayload {
  primary: {
    username: string;
    password: string;
    name: string;
    gender?: string;
    age?: number;
    title?: string;
    stats?: string;
    bio?: string;
    avatarEmoji?: string;
    themeColor?: string;
  };
  partner: {
    username: string;
    password: string;
    name: string;
    gender?: string;
    age?: number;
    title?: string;
    stats?: string;
    bio?: string;
    avatarEmoji?: string;
    themeColor?: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  partner: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerDuo: (payload: DuoRegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: (options?: { reason?: string }) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string>('person_1');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSessionInternal = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.partner) setPartner(data.partner);
        if (data.token) setToken(data.token);
        if (!activeProfileId || activeProfileId === 'person_1') {
          setActiveProfileId(data.user.id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    return await refreshSessionInternal();
  };

  const authenticatedFetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('X-Requested-With', 'XMLHttpRequest');

    const response = await fetch(input, { ...init, headers });

    if (response.status === 401 && !String(input).includes('/api/auth/')) {
      const refreshed = await refreshSessionInternal();
      if (refreshed) {
        const retryHeaders = new Headers(init.headers || {});
        if (token) {
          retryHeaders.set('Authorization', `Bearer ${token}`);
        }
        return fetch(input, { ...init, headers: retryHeaders });
      }
    }

    return response;
  };

  const logout = async (options?: { reason?: string }) => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue client cleanup even if network fails
    }

    setUser(null);
    setPartner(null);
    setToken(null);
    setActiveProfileId('person_1');
    StorageService.clearSelectedDayKey();

    const search = options?.reason ? `?reason=${encodeURIComponent(options.reason)}` : '';
    if (window.location.pathname !== '/login') {
      window.location.href = `/login${search}`;
    }
  };

  useInactivityTimeout({
    timeoutMs: 30 * 60 * 1000,
    onTimeout: () => {
      logout({ reason: 'idle_timeout' });
    },
    onActivePulse: () => {
      refreshSessionInternal();
    },
    pulseIntervalMs: 10 * 60 * 1000,
    enabled: Boolean(user && token),
  });

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid username or password.' };
      }

      setUser(data.user);
      setPartner(data.partner);
      setToken(data.token);
      setActiveProfileId(data.user.id);
      StorageService.clearSelectedDayKey();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Network error.';
      return { success: false, error: msg };
    }
  };

  const registerDuo = async (
    payload: DuoRegisterPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register-duo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      setUser(data.user);
      setPartner(data.partner);
      setToken(data.token);
      setActiveProfileId(data.user.id);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Network error.';
      return { success: false, error: msg };
    }
  };

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            setUser(data.user);
            setPartner(data.partner);
            setActiveProfileId(data.user.id);
            refreshSessionInternal();
          }
        }
      } catch {
        // Offline or not logged in
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextType = {
    user,
    partner,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    activeProfileId,
    setActiveProfileId,
    login,
    registerDuo,
    logout,
    refreshSession,
    authenticatedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
