import apiClient, { resetRefreshTracking } from './apiClient';

class AuthService {
  // Login admin user
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        deviceType: 'web'
      });
      if(response.success){
        const { data } = response;
        // Store tokens and user info
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Reset refresh tracking on successful login
        resetRefreshTracking();
        
        return {
          success: true,
          message: response.message,
          user: data.user
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post('/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Reset refresh tracking
      resetRefreshTracking();
      
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Reset refresh tracking
      resetRefreshTracking();
      
      return { success: true };
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      const { user } = response.data; // response is already response.data from apiClient
      
      // Update stored user info
      localStorage.setItem('user', JSON.stringify(user));
      
      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get profile'
      };
    }
  }

  // Get admin dashboard data
  async getDashboardData() {
    try {
      const response = await apiClient.get('/admin/dashboard');
      return response; // apiClient now returns response.data directly
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get dashboard data'
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
}

export default new AuthService(); 