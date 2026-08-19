type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  options?: Omit<RequestInit, 'method' | 'body' | 'headers'>;
  _retry?: boolean; // Added internal flag to prevent infinite refresh loops
};

export async function apiRequest<T>(
  endpoint: string, 
  { method = 'GET', body, headers, options, _retry = false }: FetchOptions = {}
): Promise<T> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI || '';
    
    const finalUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: "include",
      ...options,
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(finalUrl, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;

      // AUTOMATIC TOKEN REFRESH LOGIC
      if (errorMessage === "Access token expired" && !_retry) {
        try {
          // Adjust the "/auth/refresh_token" path if your router is mounted differently
          const refreshUrl = `${baseUrl.replace(/\/$/, '')}/api/users/auth/refresh_token`;
          
          const refreshResponse = await fetch(refreshUrl, {
            method: 'POST',
            credentials: 'include', // Crucial: this sends the refresh_token cookie
            headers: { 'Content-Type': 'application/json' },
          });

          if (!refreshResponse.ok) {
            // If the refresh token is also expired or invalid, log the user out
            if (typeof window !== 'undefined') window.location.href = '/login';
            throw new Error("Session expired. Please log in again.");
          }

          // The backend successfully set a new access_token cookie.
          // Retry the original request identically, but flag it so it won't loop.
          return await apiRequest<T>(endpoint, {
            method,
            body,
            headers,
            options,
            _retry: true 
          });

        } catch (refreshError) {
          // Fallback redirect if network completely fails during refresh
          if (typeof window !== 'undefined') window.location.href = '/login';
          throw refreshError;
        }
      }
      // ==========================================

      // If it's a different error, or the retry failed, throw normally
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Failed for ${endpoint}:`, error);
    throw error;
  }
}