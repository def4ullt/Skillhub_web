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
}

export const submissionMethodService = {
  getAll: () => api.get('/work/submission-methods'),
}