import apiClient from './apiClient';

class SemesterService {
  // Get all semesters with pagination and filters
  async getSemesters(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        sortBy,
        sortOrder
      });

      const response = await apiClient.get(`/admin/semesters?${queryParams}`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get semesters'
      };
    }
  }

  // Get semester by ID
  async getSemesterById(id) {
    try {
      const response = await apiClient.get(`/admin/semesters/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get semester'
      };
    }
  }

  // Create new semester
  async createSemester(semesterData) {
    try {
      const response = await apiClient.post('/admin/semesters', semesterData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create semester',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Update semester
  async updateSemester(id, semesterData) {
    try {
      const response = await apiClient.put(`/admin/semesters/${id}`, semesterData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update semester',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Delete semester
  async deleteSemester(id) {
    try {
      const response = await apiClient.delete(`/admin/semesters/${id}`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete semester'
      };
    }
  }

  // Get semester statistics
  async getSemesterStats() {
    try {
      const response = await apiClient.get('/admin/semesters/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get semester stats'
      };
    }
  }

  // Toggle semester status
  async toggleSemesterStatus(id) {
    try {
      const response = await apiClient.patch(`/admin/semesters/${id}/toggle-status`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle semester status'
      };
    }
  }

  // Get active semesters only
  async getActiveSemesters() {
    try {
      const response = await apiClient.get('/admin/semesters/active');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get active semesters'
      };
    }
  }
}

export default new SemesterService(); 