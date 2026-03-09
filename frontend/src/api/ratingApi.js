import api from './axios';

export const submitRating = (data) => api.post('/api/ratings/submit', data);
export const getRatingForRide = (rideId) => api.get(`/api/ratings/ride/${rideId}`);
