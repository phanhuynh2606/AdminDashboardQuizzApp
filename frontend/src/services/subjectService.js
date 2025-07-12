import apiClient from './apiClient';

class SubjectService {
  // Get all subjects with pagination and filters
  async getSubjects(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        semester = 'all',
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        semester,
        status,
        sortBy,
        sortOrder
      });

      const response = await apiClient.get(`/admin/subjects?${queryParams}`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get subjects'
      };
    }
  }

  // Get subject by ID
  async getSubjectById(id) {
    try {
      const response = await apiClient.get(`/admin/subjects/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get subject'
      };
    }
  }

  // Create new subject
  async createSubject(subjectData) {
    try {
      const response = await apiClient.post('/admin/subjects', subjectData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create subject',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Update subject
  async updateSubject(id, subjectData) {
    try {
      const response = await apiClient.put(`/admin/subjects/${id}`, subjectData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update subject',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Delete subject
  async deleteSubject(id) {
    try {
      const response = await apiClient.delete(`/admin/subjects/${id}`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete subject'
      };
    }
  }

  // Get subject statistics
  async getSubjectStats() {
    try {
      const response = await apiClient.get('/admin/subjects/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get subject stats'
      };
    }
  }

  // Toggle subject status
  async toggleSubjectStatus(id) {
    try {
      const response = await apiClient.patch(`/admin/subjects/${id}/toggle-status`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle subject status'
      };
    }
  }

  // Get subjects by semester
  async getSubjectsBySemester(semesterId) {
    try {
      const response = await apiClient.get(`/admin/subjects/semester/${semesterId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get subjects by semester'
      };
    }
  }

  // Get active subjects only
  async getActiveSubjects() {
    try {
      const response = await apiClient.get('/admin/subjects/active');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || 'Failed to get active subjects'
      };
    }
  }

  // Duplicate subject to another semester
  async duplicateSubject(id, targetSemesterId) {
    try {
      const response = await apiClient.post(`/admin/subjects/${id}/duplicate`, {
        targetSemesterId
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || 'Failed to duplicate subject'
      };
    }
  }
}

export default new SubjectService(); 