import apiClient from './apiClient';

class ExamService {
  // Get all exams with pagination and filters
  async getExams(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        semester = 'all',
        subject = 'all',
        examType = 'all',
        status = 'all',
        published = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        semester,
        subject,
        examType,
        status,
        published,
        sortBy,
        sortOrder
      });

      const response = await apiClient.get(`/admin/exams?${queryParams}`);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get exams'
      };
    }
  }

  // Get exam by ID
  async getExamById(id) {
    try {
      const response = await apiClient.get(`/admin/exams/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get exam'
      };
    }
  }

  // Create new exam
  async createExam(examData) {
    try {
      const response = await apiClient.post('/admin/exams', examData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create exam',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Update exam
  async updateExam(id, examData) {
    try {
      const response = await apiClient.put(`/admin/exams/${id}`, examData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update exam',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // Delete exam
  async deleteExam(id) {
    try {
      const response = await apiClient.delete(`/admin/exams/${id}`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete exam'
      };
    }
  }

  // Get exam statistics
  async getExamStats() {
    try {
      const response = await apiClient.get('/admin/exams/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get exam stats'
      };
    }
  }

  // Toggle exam status
  async toggleExamStatus(id) {
    try {
      const response = await apiClient.patch(`/admin/exams/${id}/toggle-status`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle exam status'
      };
    }
  }

  // Toggle exam published status
  async toggleExamPublished(id) {
    try {
      const response = await apiClient.patch(`/admin/exams/${id}/toggle-published`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle exam published status'
      };
    }
  }

  // Get exam questions
  async getExamQuestions(examId) {
    try {
      const response = await apiClient.get(`/admin/exams/${examId}/questions`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get exam questions'
      };
    }
  }



  // Add question to exam
  async addQuestionToExam(examId, questionData) {
    try {
      const response = await apiClient.post(`/admin/exams/${examId}/questions`, questionData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add question to exam'
      };
    }
  }

  // Remove question from exam
  async removeQuestionFromExam(examId, questionId) {
    try {
      const response = await apiClient.delete(`/admin/exams/${examId}/questions/${questionId}`);
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove question from exam'
      };
    }
  }

  // Update question in exam
  async updateExamQuestion(examId, questionId, questionData) {
    try {
      const response = await apiClient.put(`/admin/exams/${examId}/questions/${questionId}`, questionData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update exam question'
      };
    }
  }

  // Duplicate exam
  async duplicateExam(id, examData) {
    try {
      const response = await apiClient.post(`/admin/exams/${id}/duplicate`, examData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to duplicate exam'
      };
    }
  }

  // Get exam types
  async getExamTypes() {
    try {
      const response = await apiClient.get('/admin/exam-types');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get exam types'
      };
    }
  }
}

export default new ExamService(); 