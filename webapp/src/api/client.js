import { isTokenExpired } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Check if we're on server or client side
    const isServer = typeof window === 'undefined';
    
    // Set up headers based on content type
    const headers = options.body instanceof FormData
      ? { ...options.headers } // Let browser set multipart/form-data boundary
      : { 'Content-Type': 'application/json', ...options.headers };
    
    // Add security headers
    headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Only handle auth tokens on client-side
    if (!isServer) {
      // Get auth token from cookie
      const currentUserCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('currentUser='));

      if (currentUserCookie) {
        try {
          // Check if token is expired before making request
          if (isTokenExpired()) {
            // Token expired, redirect to login
            const locale = window.location.pathname.split('/')[1] || 'en';
            window.location.href = `/${locale}/login?expired=true`;
            throw new Error('Session expired. Please log in again.');
          }
          
          const userData = JSON.parse(decodeURIComponent(currentUserCookie.split('=')[1]));
          if (userData.access_token) {
            headers['Authorization'] = `Bearer ${userData.access_token}`;
          }
        } catch (error) {
          if (error.message !== 'Session expired. Please log in again.') {
            console.error('Error processing authentication:', error);
          }
        }
      }
    }
    
    // Perform the fetch
    const response = await fetch(url, {
      headers,
      credentials: 'include',
      ...options,
    });

    // Handle error responses
    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        errorDetails = response.statusText;
      }

      // Special client-side handling for authentication errors
      if (!isServer && response.status === 401) {
        // Redirect to login on authentication issues
        const locale = window.location.pathname.split('/')[1] || 'en';
        window.location.href = `/${locale}/login?expired=true`;
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(`API error (${response.status}): ${errorDetails}`);
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
    console.error('API request failed:', error);
    throw error;
  }
}