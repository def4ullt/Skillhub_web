import api from './api'

export const taskService = {
  getAll: (params) => api.get('/tasks/tasks', { params }),
  getById: (id) => api.get(`/tasks/tasks/${id}`),
  create: (data) => api.post('/tasks/tasks', data),
  update: (id, data) => api.put(`/tasks/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/tasks/${id}`),
}

export const tagService = {
  getAll: () => api.get('/tasks/tags'),
  create: (data) => api.post('/tasks/tags', data),
  update: (id, data) => api.put(`/tasks/tags/${id}`, data),
  delete: (id) => api.delete(`/tasks/tags/${id}`),
}

export const technologyService = {
  getAll: () => api.get('/tasks/technologies'),
  create: (data) => api.post('/tasks/technologies', data),
  update: (id, data) => api.put(`/tasks/technologies/${id}`, data),
  delete: (id) => api.delete(`/tasks/technologies/${id}`),
}