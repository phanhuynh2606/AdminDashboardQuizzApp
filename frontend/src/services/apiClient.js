import axios from 'axios';

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for refresh token
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't try to refresh token for login requests or if already retrying
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await apiClient.post('/auth/refresh-token');
        const { accessToken } = refreshResponse.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login only if not already on login page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Use React Router navigation instead of window.location
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 