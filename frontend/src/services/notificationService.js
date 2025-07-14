import apiClient from './apiClient';

const notificationService = {
  getNotifications: async (filters) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await apiClient.get(`/admin/notifications?${params}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createNotification: async (notificationData) => {
    try {
      const response = await apiClient.post('/admin/notifications', notificationData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateNotification: async (id, notificationData) => {
    try {
      const response = await apiClient.put(`/admin/notifications/${id}`, notificationData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/admin/notifications/${id}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default notificationService; 