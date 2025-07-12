import apiClient from './apiClient';

class QuestionService {
  // Get all questions with pagination and filters
  async getQuestions(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        subjectCode = 'all',
        examType = 'all',
        difficulty = 'all',
        tags = '',
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        subjectCode,
        examType,
        difficulty,
        tags,
        status,
        sortBy,
        sortOrder
      });

      const response = await apiClient.get(`/admin/questions?${queryParams}`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || 'Failed to get questions'
      };
    }
  }

  // Get question by ID
  async getQuestionById(id) {
    try {
      const response = await apiClient.get(`/admin/questions/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get question'
      };
    }
  }

  // Create new question
  async createQuestion(questionData) {
    try {
      const response = await apiClient.post('/admin/questions', questionData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || 'Failed to create question',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Update question
  async updateQuestion(id, questionData) {
    try {
      const response = await apiClient.put(`/admin/questions/${id}`, questionData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update question',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Delete question
  async deleteQuestion(id) {
    try {
      const response = await apiClient.delete(`/admin/questions/${id}`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || 'Failed to delete question'
      };
    }
  }

  // Get question statistics
  async getQuestionStats() {
    try {
      const response = await apiClient.get('/admin/questions/stats');
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get question stats'
      };
    }
  }

  // Toggle question status
  async toggleQuestionStatus(id) {
    try {
      const response = await apiClient.patch(`/admin/questions/${id}/toggle-status`);
      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle question status'
      };
    }
  }

  // Upload question image
  async uploadQuestionImage(questionId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await apiClient.post(`/admin/questions/${questionId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload image'
      };
    }
  }

  // Delete question image
  async deleteQuestionImage(questionId) {
    try {
      const response = await apiClient.delete(`/admin/questions/${questionId}/image`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete image'
      };
    }
  }

  // Get questions by subject and exam type
  async getQuestionsBySubjectAndType(subjectCode, examType) {
    try {
      const response = await apiClient.get(`/admin/questions/subject/${subjectCode}/type/${examType}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get questions by subject and type'
      };
    }
  }

  // Duplicate question
  async duplicateQuestion(id, questionData) {
    try {
      const response = await apiClient.post(`/admin/questions/${id}/duplicate`, questionData);
      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to duplicate question'
      };
    }
  }

  // Import questions from file
  async importQuestions(file, importOptions = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add import options
      Object.keys(importOptions).forEach(key => {
        formData.append(key, importOptions[key]);
      });

      const response = await apiClient.post('/admin/questions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to import questions'
      };
    }
  }

  // Export questions to file
  async exportQuestions(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await apiClient.get(`/admin/questions/export?${queryParams}`, {
        responseType: 'blob'
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export questions'
      };
    }
  }

  // Get available tags
  async getQuestionTags() {
    try {
      const response = await apiClient.get('/admin/questions/tags');
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get question tags'
      };
    }
  }

  // Bulk operations
  async bulkUpdateQuestions(questionIds, updateData) {
    try {
      const response = await apiClient.patch('/admin/questions/bulk-update', {
        questionIds,
        updateData
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to bulk update questions'
      };
    }
  }

  async bulkDeleteQuestions(questionIds) {
    try {
      const response = await apiClient.delete('/admin/questions/bulk-delete', {
        data: { questionIds }
      });
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to bulk delete questions'
      };
    }
  }
}

export default new QuestionService(); 