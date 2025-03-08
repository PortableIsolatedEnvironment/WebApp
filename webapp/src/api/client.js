const API_BASE_URL = 'http://localhost:8000';

export async function fetchApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = options.body instanceof FormData
      ? { ...options.headers }
      : { 'Content-Type': 'application/json', ...options.headers };
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    // Special handling for 404 responses - return null instead of throwing
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    // Handle empty responses or DELETE requests
    if (options.method === 'DELETE' || response.headers.get('content-length') === '0') {
      return true;
    }
    
    // Check content type before trying to parse as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Return text for non-JSON responses
    return await response.text();
  } catch (error) {
    // Don't log 404 errors to reduce console noise
    if (!error.message?.includes('API error: 404')) {
      console.error('API request failed:', error);
    }
    throw error;
  }
}