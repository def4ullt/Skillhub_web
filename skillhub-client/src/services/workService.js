import api from './api'

export const workSubmissionService = {
  getAll: (params) => api.get('/work/work-submissions', { params }),
  getById: (id) => api.get(`/work/work-submissions/${id}`),
  create: (data) => api.post('/work/work-submissions', data),
  update: (id, data) => api.put(`/work/work-submissions/${id}`, data),
  delete: (id) => api.delete(`/work/work-submissions/${id}`),
}

export const submissionStatusService = {
  getAll: () => api.get('/work/submission-statuses'),
  create: (data) => api.post('/work/submission-statuses', data),
  update: (id, data) => api.put(`/work/submission-statuses/${id}`, data),
  delete: (id) => api.delete(`/work/submission-statuses/${id}`),
}

export const submissionMethodService = {
  getAll: () => api.get('/work/submission-methods'),
  create: (data) => api.post('/work/submission-methods', data),
  update: (id, data) => api.put(`/work/submission-methods/${id}`, data),
  delete: (id) => api.delete(`/work/submission-methods/${id}`),
}

export const userXpService = {
  getLeaderboard: (params) => api.get('/work/user-xp/leaderboard', { params }),
  getAllUsers: (params) => api.get('/work/user-xp/users', { params }),
  getByUser: (userId) => api.get(`/work/user-xp/user/${userId}`),
  getTotalByUser: (userId) => api.get(`/work/user-xp/user/${userId}/total`),
  adjust: (data) => api.post('/work/user-xp/adjust', data),
  rename: (userId, data) => api.put(`/work/user-xp/users/${userId}/rename`, data),
}