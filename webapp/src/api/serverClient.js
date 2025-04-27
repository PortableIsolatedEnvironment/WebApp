import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchServerApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Try to get authentication token from cookies
    // Only works in Route Handlers and Server Components
    try {
      // Make cookies() usage async
      const cookieStore = await cookies();
      const currentUserCookie = cookieStore.get('currentUser');
      
      if (currentUserCookie) {
        const userData = JSON.parse(decodeURIComponent(currentUserCookie.value));
        if (userData.access_token) {
          headers['Authorization'] = `Bearer ${userData.access_token}`;
        }
      }
    } catch (cookieError) {
      console.error('Error accessing cookies:', cookieError);
      // Continue without authentication
    }
    
    // Perform server-side fetch
    const response = await fetch(url, {
      ...options,
      headers,
      cache: options.cache || 'no-store', // Disable caching by default
      next: { revalidate: options.revalidate || 0 } // Set revalidation period
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      throw new Error(`API error (${response.status}): ${errorData.message || JSON.stringify(errorData)}`);
    }

    // Check content type before trying to parse as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Return text for non-JSON responses
    return await response.text();
  } catch (error) {
    console.error('Server API request failed:', error);
    throw error;
  }
}