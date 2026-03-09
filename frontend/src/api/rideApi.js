import api from './axios';

export const bookRide = (data) => api.post('/api/rides/book', data);
export const getRide = (id) => api.get(`/api/rides/${id}`);
export const cancelRide = (id) => api.put(`/api/rides/${id}/cancel`);
export const getRideHistory = () => api.get('/api/rides/history');
