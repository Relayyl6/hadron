type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  options?: Omit<RequestInit, 'method' | 'body' | 'headers'>;
};

export async function apiRequest<T>(endpoint: string, { method = 'GET', body, headers, options }: FetchOptions = {}): Promise<T> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    const finalUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...options,
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(finalUrl, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Failed for ${endpoint}:`, error);
    throw error;
  }
}