type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  options?: Omit<RequestInit, 'method' | 'body' | 'headers'>;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

let isFetchingCsrf = false;
let csrfPromise: Promise<string | null> | null = null;

async function getCsrfToken(baseUrl: string): Promise<string | null> {
  // 1. Check in-memory cache / active promise
  if (isFetchingCsrf && csrfPromise) return csrfPromise;

  // 2. Check localStorage cache
  if (typeof window !== 'undefined') {
    const cachedToken = localStorage.getItem('csrfToken');
    if (cachedToken) return cachedToken;
  }

  // 3. Fetch fresh token if not cached
  isFetchingCsrf = true;
  csrfPromise = fetch(`${baseUrl}/api/users/api/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.csrfToken) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('csrfToken', data.csrfToken);
        }
        return data.csrfToken;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      isFetchingCsrf = false;
      csrfPromise = null;
    });

  return csrfPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  { method = 'GET', body, headers, options }: FetchOptions = {},
  _retryCount = 0
): Promise<T> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

    const finalUrl = endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
      ...options,
    };

    // Inject CSRF token for mutations
    if (method !== 'GET') {
      const token = await getCsrfToken(baseUrl);
      if (token) {
        config.headers = {
          ...config.headers,
          'x-csrf-token': token,
        };
      }
    }

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(finalUrl, config);

    // Auto-refresh token interceptor
    if (response.status === 401 && _retryCount === 0) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        refreshPromise = (async () => {
          try {
            const csrf = await getCsrfToken(baseUrl);
            const res = await fetch(`${baseUrl}/api/users/auth/refresh_token`, {
              method: 'POST',
              credentials: 'include',
              headers: { 
                'Content-Type': 'application/json',
                ...(csrf ? { 'x-csrf-token': csrf } : {})
              }
            });
            return res.ok;
          } catch (err) {
            return false;
          }
        })().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;
      
      if (refreshed) {
        // Retry the original request exactly once
        return apiRequest<T>(endpoint, { method, body, headers, options }, 1);
      } else {
        // If refresh fails, they really need to log in
        if (typeof window !== 'undefined') {
          localStorage.removeItem('csrfToken');
          window.location.href = '/log-in';
        }
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle invalid CSRF token
      if (response.status === 403 && _retryCount === 0 && errorData?.message?.toLowerCase().includes('csrf')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('csrfToken');
        }
        return apiRequest<T>(endpoint, { method, body, headers, options }, 1);
      }

      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Failed for ${endpoint}:`, error);
    throw error;
  }
}
