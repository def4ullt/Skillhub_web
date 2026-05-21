import api from './api'

export const reviewService = {
  getAll: (params) => api.get('/reviews/reviews', { params }),
  getById: (id) => api.get(`/reviews/reviews/${id}`),
  create: (data) => api.post('/reviews/reviews', data),
  update: (id, data) => api.put('/reviews/reviews', { reviewId: id, ...data }),
  delete: (id, requestingUserId, isAdmin) => api.delete('/reviews/reviews', { data: { reviewId: id, requestingUserId, isAdmin } }),
}

export const submissionReviewService = {
  getAll: (params) => api.get('/reviews/submission-reviews', { params }),
  create: (data) => api.post('/reviews/submission-reviews', data),
  delete: (id) => api.delete(`/reviews/submission-reviews/${id}`),
}

export const questionService = {
  getAll: (params) => api.get('/reviews/questions', { params }),
  getById: (id) => api.get(`/reviews/questions/${id}`),
  create: (data) => api.post('/reviews/questions', data),
  update: (id, data) => api.put(`/reviews/questions/${id}`, data),
  delete: (id) => api.delete(`/reviews/questions/${id}`),
}