type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  options?: Omit<RequestInit, 'method' | 'body' | 'headers'>;
};

// Helper to grab cookie from browser
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return '';
};

export async function apiRequest<T>(
  endpoint: string,
  { method = 'GET', body, headers, options }: FetchOptions = {},
): Promise<T> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    const finalUrl = endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    // If it's a mutation (POST/PUT/PATCH/DELETE), check if we have the CSRF cookie
    let csrfToken = getCookie('x-csrf-token');

    // If the token is missing and we are trying to post, let's fetch it on the fly first!
    if (!csrfToken && method !== 'GET') {
      try {
        await fetch(`${baseUrl}/api/users/api/csrf-token`, {
          credentials: 'include',
        });
        csrfToken = getCookie('x-csrf-token');
      } catch (e) {
        console.warn('Auto-fetch CSRF token failed:', e);
      }
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && method !== 'GET' ? { 'x-csrf-token': csrfToken } : {}),
        ...headers,
      },
      credentials: 'include',
      ...options,
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(finalUrl, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
