import api from './axios';

export const getPayment = (rideId) => api.get(`/api/payments/${rideId}`);
export const confirmPayment = (rideId, paymentMethod) =>
  api.post(`/api/payments/${rideId}/confirm`, { paymentMethod });
