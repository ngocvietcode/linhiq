const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
  _retry?: boolean;
}

// Ensure multiple requests don't spawn multiple refresh attempts
let refreshPromise: Promise<string | null> | null = null;

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, _retry } = options;
  let token = options.token;

  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem("javirs_token") || undefined;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    credentials: "include", // Important for HTTP-Only cookie transfer
    body: body ? JSON.stringify(body) : undefined,
  });

  // Catch unauthenticated errors
  if (res.status === 401 && !_retry && typeof window !== 'undefined' && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          
          if (!refreshRes.ok) throw new Error("Token refresh rejected");
          
          const data = await refreshRes.json();
          const newToken = data.accessToken;
          localStorage.setItem("javirs_token", newToken);
          window.dispatchEvent(new CustomEvent('token_refreshed', { detail: newToken }));
          return newToken;
        } catch (e) {
          window.dispatchEvent(new Event('session_expired'));
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const newToken = await refreshPromise;
    if (newToken) {
      // Retry original request seamlessly with new token
      return api(endpoint, { ...options, token: newToken, _retry: true });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}
