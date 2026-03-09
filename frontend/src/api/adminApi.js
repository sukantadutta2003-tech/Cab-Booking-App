import api from './axios';

export const getStats = () => api.get('/api/admin/stats');
export const getAllRides = (page = 0, size = 20) =>
  api.get(`/api/admin/rides?page=${page}&size=${size}`);
export const getAllDrivers = () => api.get('/api/admin/drivers');
export const getAllUsers = () => api.get('/api/admin/users');
