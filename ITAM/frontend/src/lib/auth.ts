export type BackendUserRole = "admin" | "it_team" | "finance";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: BackendUserRole;
  department?: string;
  is_active?: boolean;
  date_joined?: string;
}

// Axios support: create an axios instance and add a refresh-on-401 interceptor.
// Lazily import axios to avoid bundling it when not used.
export async function createAxiosWithAuth(axiosInstance?: any) {
  // If caller supplies an existing axios instance, use it; otherwise import default axios
  const axios = axiosInstance ?? (await import('axios')).default;

  axios.interceptors.request.use((config: any) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let isRefreshing = false;
  let failedQueue: Array<{ resolve: (v?: any) => void; reject: (e: any) => void; config: any }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((p) => {
      if (error) p.reject(error);
      else {
        if (token) p.config.headers.Authorization = `Bearer ${token}`;
        p.resolve(axios(p.config));
      }
    });
    failedQueue = [];
  };

  axios.interceptors.response.use(
    (res: any) => res,
    async (err: any) => {
      const origReq = err.config;
      if (!origReq) return Promise.reject(err);

      if (err.response && err.response.status === 401 && !origReq._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject, config: origReq });
          });
        }

        origReq._retry = true;
        isRefreshing = true;
        try {
          const refresh = getRefreshToken();
          if (!refresh) throw new Error('No refresh token');
          const r = await fetch('/api/auth/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
          });
          if (!r.ok) throw new Error('Refresh failed');
          const data = await r.json();
          const newAccess = data.access;
          if (!newAccess) throw new Error('No access token in refresh response');
          const user = getStoredUser();
          setAuthSession(newAccess, refresh, user ?? ({} as any));
          processQueue(null, newAccess);
          return axios(origReq);
        } catch (e) {
          processQueue(e, null);
          clearAuthSession();
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(err);
    }
  );

  return axios;
}

const ACCESS_TOKEN_KEY = "assetBuddy.auth.accessToken";
const REFRESH_TOKEN_KEY = "assetBuddy.auth.refreshToken";
const USER_KEY = "assetBuddy.auth.user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function setAuthSession(access: string, refresh: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("asset-buddy-auth-changed", { detail: user }));
  window.dispatchEvent(new CustomEvent("asset-buddy-role-changed", { detail: user.role }));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("asset-buddy-auth-changed", { detail: null }));
  window.dispatchEvent(new CustomEvent("asset-buddy-role-changed", { detail: "user" }));
}

export async function fetchCurrentUser(accessToken?: string): Promise<AuthUser> {
  const token = accessToken ?? getAccessToken();
  if (!token) {
    throw new Error("Missing access token");
  }
  const response = await fetch("/api/users/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to load current user");
  }
  return (await response.json()) as AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const tokenResponse = await fetch("/api/auth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!tokenResponse.ok) {
    throw new Error("Invalid email or password");
  }
  const tokens = (await tokenResponse.json()) as { access: string; refresh: string };
  const user = await fetchCurrentUser(tokens.access);
  setAuthSession(tokens.access, tokens.refresh, user);
  return user;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

// NOTE: some parts of the frontend use fetch; other modules may use axios.
// This helper implements a fetch-based retry flow for 401 responses by
// attempting to refresh the access token using the stored refresh token.

async function tryRefreshToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch('/api/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess = data.access as string | undefined;
    if (!newAccess) return null;
    // store new access token
    const user = getStoredUser();
    setAuthSession(newAccess, refresh, user ?? ({} as any));
    return newAccess;
  } catch {
    return null;
  }
}

export async function authFetchWithRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response = await authFetch(input, init);
  if (response.status !== 401) return response;

  // Attempt refresh once
  const newAccess = await tryRefreshToken();
  if (!newAccess) {
    // clearing session on refresh failure keeps behavior consistent
    clearAuthSession();
    return response;
  }

  // Retry original request with new token
  const headers = new Headers(init?.headers ?? {});
  headers.set('Authorization', `Bearer ${newAccess}`);
  response = await fetch(input, { ...init, headers });
  return response;
}
