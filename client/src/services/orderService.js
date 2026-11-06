import api from './api';

export const placeOrder = async (shippingAddress) => {
  // CRITICAL: Send only shippingAddress, never send prices or totals
  const response = await api.post('/orders', { shippingAddress });
  return response.data;
};

export const getMyOrders = async (page = 1) => {
  const response = await api.get('/orders/my-orders', { params: { page } });
  return response.data;
};

export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const getAllOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export default {
  placeOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
};
