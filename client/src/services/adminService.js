import api from './api';

export const getStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getUsers = async (page = 1) => {
  const response = await api.get('/admin/users', { params: { page } });
  return response.data;
};

export default {
  getStats,
  getUsers,
};
