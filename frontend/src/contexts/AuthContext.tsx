import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "../lib/authApi";
import * as authApi from "../lib/authApi";

const REFRESH_KEY = "sentimind_refresh";
const ACCESS_KEY = "sentimind_access";
const USER_KEY = "sentimind_user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: authApi.SignupBody) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string, user: User) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function getStoredAccess(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

function getStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true,
  });

  const clearAuth = useCallback(() => {
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(USER_KEY);
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
    });
  }, []);

  const setTokens = useCallback(
    (access: string, refresh: string, user: User) => {
      sessionStorage.setItem(ACCESS_KEY, access);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(REFRESH_KEY, refresh);
      setState({
        user,
        accessToken: access,
        refreshToken: refresh,
        loading: false,
      });
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      setTokens(res.accessToken, res.refreshToken, res.user);
    },
    [setTokens]
  );

  const signup = useCallback(async (data: authApi.SignupBody) => {
    await authApi.signup(data);
  }, []);

  const logout = useCallback(async () => {
    const refresh = state.refreshToken ?? getStoredRefresh();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        /* ignore */
      }
    }
    clearAuth();
  }, [state.refreshToken, clearAuth]);

  useEffect(() => {
    const refresh = getStoredRefresh();
    const access = getStoredAccess();
    const user = getStoredUser();
    if (access && user) {
      setState({
        accessToken: access,
        refreshToken: refresh,
        user,
        loading: false,
      });
      return;
    }
    if (refresh) {
      authApi
        .refresh(refresh)
        .then((res) => setTokens(res.accessToken, res.refreshToken, res.user))
        .catch(() => clearAuth());
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [clearAuth, setTokens]);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    setTokens,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
