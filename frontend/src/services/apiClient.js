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
  timeout: 10000, // 10 second timeout
});

// Refresh token queue to prevent multiple concurrent refresh requests
let isRefreshing = false;
let failedQueue = [];
let lastRefreshTime = 0;
let refreshCount = 0;
const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown between refresh attempts

// Process queued requests after refresh token success/failure
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Reset refresh tracking (call on successful login)
const resetRefreshTracking = () => {
  refreshCount = 0;
  lastRefreshTime = 0;
  isRefreshing = false;
  failedQueue = [];
};

// Get refresh stats (for debugging)
const getRefreshStats = () => ({
  refreshCount,
  lastRefreshTime,
  isRefreshing,
  queueLength: failedQueue.length,
  timeSinceLastRefresh: Date.now() - lastRefreshTime
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
    
    // Don't try to refresh token for login/refresh requests or if already retrying
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/refresh-token')) {
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // Check cooldown to prevent too frequent refresh attempts
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        console.warn('Refresh cooldown active, rejecting request');
        return Promise.reject(new Error('Refresh token cooldown active'));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      lastRefreshTime = now;
      
      try {
        refreshCount++;
        console.log(`Attempting to refresh token... (attempt #${refreshCount})`);
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const { accessToken } = refreshResponse.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests with new token
        processQueue(null, accessToken);
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect to login
        console.error('Refresh token failed:', refreshError.response?.data || refreshError.message);
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Clear any cookies
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          console.log('Redirecting to login page...');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
export { resetRefreshTracking, getRefreshStats }; 