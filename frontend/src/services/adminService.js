import apiClient from './apiClient';

class AdminService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/admin/dashboard');
      return response; // apiClient now returns response.data directly
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get dashboard stats'
      };
    }
  }

  // Get users with pagination and filters
  async getUsers(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role = 'all',
        status = 'all',
        level = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role,
        status,
        level,
        sortBy,
        sortOrder
      });

      const response = await apiClient.get(`/admin/users?${queryParams}`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get users'
      };
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await apiClient.get(`/admin/users/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user'
      };
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await apiClient.post('/admin/users', userData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create user',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      const response = await apiClient.put(`/admin/users/${id}`, userData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const response = await apiClient.delete(`/admin/users/${id}`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete user'
      };
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await apiClient.get('/admin/users/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user stats'
      };
    }
  }

  // Clean activity logs by time period
  async cleanActivityLogsByTime(period) {
    try {
      const response = await apiClient.post('/admin/activities/clean', { period });
      return response; // apiClient returns response.data directly
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to clean activity logs'
      };
    }
  }
}

export default new AdminService(); 