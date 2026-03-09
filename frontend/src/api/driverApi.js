import api from './axios';

export const updateStatus = (data) => api.put('/api/driver/status', data);
export const getPendingRides = () => api.get('/api/driver/rides/pending');
export const acceptRide = (id) => api.put(`/api/driver/rides/${id}/accept`);
export const rejectRide = (id) => api.put(`/api/driver/rides/${id}/reject`);
export const startRide = (id) => api.put(`/api/driver/rides/${id}/start`);
export const completeRide = (id) => api.put(`/api/driver/rides/${id}/complete`);
export const getEarnings = () => api.get('/api/driver/earnings');
export const getDriverHistory = () => api.get('/api/driver/rides/history');
