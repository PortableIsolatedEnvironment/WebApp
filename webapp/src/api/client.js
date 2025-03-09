const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set up headers based on content type
    const headers = options.body instanceof FormData
      ? { ...options.headers } // Let browser set multipart/form-data boundary
      : { 'Content-Type': 'application/json', ...options.headers };
    
    // * TODO Add CSRF token from cookie if available (if your backend uses CSRF protection)
    // const csrfToken = getCsrfToken();
    // if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
    //   headers['X-CSRF-Token'] = csrfToken;
    // }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    // Perform the fetch with timeout
    const response = await fetch(url, {
      headers,
      credentials: 'include', // Always include credentials for authenticated requests
      signal: controller.signal,
      ...options,
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // Handle specific error status codes
    if (!response.ok) {
      // Get error details from response if possible
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        // If we can't parse JSON, use status text
        errorDetails = response.statusText;
      }

      // Throw specific errors based on status
      switch (response.status) {
        case 400:
          throw new Error(`Bad request: ${errorDetails}`);
        case 401:
          // Redirect to login on authentication issues
          window.location.href = '/login?expired=true';
          throw new Error('Session expired. Please log in again.');
        case 403:
          throw new Error(`Access denied: ${errorDetails}`);
        case 404:
          return null; // Special handling for 404 - return null
        case 500:
          throw new Error(`Server error: ${errorDetails}`);
        default:
          throw new Error(`API error (${response.status}): ${errorDetails}`);
      }
    }

    // Handle empty responses or DELETE requests
    if (options.method === 'DELETE' || response.headers.get('content-length') === '0') {
      return true;
    }
    
    // Handle no-content responses
    if (response.status === 204) {
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
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again later.');
    }
    
    // Don't log 404 errors to reduce console noise
    if (!error.message?.includes('API error: 404')) {
      console.error('API request failed:', error);
    }
    throw error;
  }
}

// /**
//  * TODO Get CSRF token from cookies 
//  */
// function getCsrfToken() {
//   // This implementation depends on how your backend sends CSRF tokens
//   // For example, if it's set in a cookie named 'csrf_token':
//   const cookies = document.cookie.split(';');
//   for (const cookie of cookies) {
//     const [name, value] = cookie.trim().split('=');
//     if (name === 'csrf_token') {
//       return decodeURIComponent(value);
//     }
//   }
//   return null;
// }