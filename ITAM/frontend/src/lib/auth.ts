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

// Django API base URL.
// Local development: VITE_API_URL can be empty, so requests use the same host.
// Render: VITE_API_URL=https://awash-itam-api.onrender.com
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Converts a frontend API path such as:
 *   /api/assets/
 *
 * into:
 *   https://awash-itam-api.onrender.com/api/assets/
 *
 * when VITE_API_URL is configured.
 */
function apiUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string") {
    if (input.startsWith("/api/")) {
      return `${API_URL}${input}`;
    }
    return input;
  }

  if (input instanceof URL) {
    if (input.pathname.startsWith("/api/")) {
      return `${API_URL}${input.pathname}${input.search}`;
    }
  }

  return input;
}

// Axios support: create an axios instance and add a refresh-on-401 interceptor.
// Lazily import axios to avoid bundling it when not used.
export async function createAxiosWithAuth(axiosInstance?: any) {
  const axios = axiosInstance ?? (await import("axios")).default;

  axios.interceptors.request.use((config: any) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send API requests to Django backend.
    if (config.url && typeof config.url === "string") {
      if (config.url.startsWith("/api/")) {
        config.url = `${API_URL}${config.url}`;
      }
    }

    return config;
  });

  let isRefreshing = false;

  let failedQueue: Array<{
    resolve: (v?: any) => void;
    reject: (e: any) => void;
    config: any;
  }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((p) => {
      if (error) {
        p.reject(error);
      } else {
        if (token) {
          p.config.headers = p.config.headers || {};
          p.config.headers.Authorization = `Bearer ${token}`;
        }

        p.resolve(axios(p.config));
      }
    });

    failedQueue = [];
  };

  axios.interceptors.response.use(
    (res: any) => res,

    async (err: any) => {
      const origReq = err.config;

      if (!origReq) {
        return Promise.reject(err);
      }

      if (
        err.response &&
        err.response.status === 401 &&
        !origReq._retry
      ) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({
              resolve,
              reject,
              config: origReq,
            });
          });
        }

        origReq._retry = true;
        isRefreshing = true;

        try {
          const refresh = getRefreshToken();

          if (!refresh) {
            throw new Error("No refresh token");
          }

          const r = await fetch(
            apiUrl("/api/auth/token/refresh/") as string,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh }),
            }
          );

          if (!r.ok) {
            throw new Error("Refresh failed");
          }

          const data = await r.json();
          const newAccess = data.access;

          if (!newAccess) {
            throw new Error("No access token in refresh response");
          }

          const user = getStoredUser();

          setAuthSession(
            newAccess,
            refresh,
            user ?? ({} as AuthUser)
          );

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
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function setAuthSession(
  access: string,
  refresh: string,
  user: AuthUser
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));

  window.dispatchEvent(
    new CustomEvent("asset-buddy-auth-changed", {
      detail: user,
    })
  );

  window.dispatchEvent(
    new CustomEvent("asset-buddy-role-changed", {
      detail: user.role,
    })
  );
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);

  window.dispatchEvent(
    new CustomEvent("asset-buddy-auth-changed", {
      detail: null,
    })
  );

  window.dispatchEvent(
    new CustomEvent("asset-buddy-role-changed", {
      detail: "user",
    })
  );
}

export async function fetchCurrentUser(
  accessToken?: string
): Promise<AuthUser> {
  const token = accessToken ?? getAccessToken();

  if (!token) {
    throw new Error("Missing access token");
  }

  const response = await fetch(
    apiUrl("/api/users/me/") as string,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load current user");
  }

  return (await response.json()) as AuthUser;
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const tokenResponse = await fetch(
    apiUrl("/api/auth/token/") as string,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("Invalid email or password");
  }

  const tokens = (await tokenResponse.json()) as {
    access: string;
    refresh: string;
  };

  const user = await fetchCurrentUser(tokens.access);

  setAuthSession(
    tokens.access,
    tokens.refresh,
    user
  );

  return user;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(
    init?.headers ?? {}
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return fetch(apiUrl(input), {
    ...init,
    headers,
  });
}

// Fetch-based refresh flow for 401 responses.
async function tryRefreshToken(): Promise<string | null> {
  const refresh = getRefreshToken();

  if (!refresh) {
    return null;
  }

  try {
    const res = await fetch(
      apiUrl("/api/auth/token/refresh/") as string,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh,
        }),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const newAccess =
      data.access as string | undefined;

    if (!newAccess) {
      return null;
    }

    const user = getStoredUser();

    setAuthSession(
      newAccess,
      refresh,
      user ?? ({} as AuthUser)
    );

    return newAccess;
  } catch {
    return null;
  }
}

export async function authFetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let response = await authFetch(
    input,
    init
  );

  if (response.status !== 401) {
    return response;
  }

  const newAccess =
    await tryRefreshToken();

  if (!newAccess) {
    clearAuthSession();
    return response;
  }

  const headers = new Headers(
    init?.headers ?? {}
  );

  headers.set(
    "Authorization",
    `Bearer ${newAccess}`
  );

  response = await fetch(
    apiUrl(input),
    {
      ...init,
      headers,
    }
  );

  return response;
}