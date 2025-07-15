// services/practiceHistoryService.js
import apiClient from "./apiClient";

class PracticeHistoryService {

  // Lấy danh sách lịch sử làm bài
  async getHistories(params = {}) {
    try {
      const response = await apiClient.get('/admin/exam-history', { params });
      return response;
    } catch (error) {
      console.error('Error getting histories:', error);
      throw error;
    }
  }

  // Lấy chi tiết một lần làm bài
  async getHistoryDetail(id) {
    try {
      const response = await apiClient.get(`/admin/exam-history/${id}`);
      return response;
    } catch (error) {
      console.error('Error getting history detail:', error);
      throw error;
    }
  }

  // Tạo mới lịch sử làm bài
  async createHistory(data) {
    try {
      const response = await apiClient.post('/admin/exam-history', data);
      return response;
    } catch (error) {
      console.error('Error creating history:', error);
      throw error;
    }
  }

  // Cập nhật lịch sử làm bài
  async updateHistory(id, data) {
    try {
      const response = await apiClient.put(`/admin/exam-history/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating history:', error);
      throw error;
    }
  }

  // Xóa lịch sử làm bài
  async deleteHistory(id) {
    try {
      const response = await apiClient.delete(`/admin/exam-history/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting history:', error);
      throw error;
    }
  }

  // Lấy thống kê tổng quan
  async getOverviewStats(params = {}) {
    try {
      const response = await apiClient.get('/admin/exam-history/stats/overview', { params });
      return response;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  // Xuất dữ liệu lịch sử
  async exportHistories(params = {}) {
    try {
      const response = await apiClient.get('/admin/exam-history/export', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting histories:', error);
      throw error;
    }
  }
}

export default new PracticeHistoryService();