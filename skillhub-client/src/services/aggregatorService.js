import api from './api'

export const aggregatorService = {
  getFilters: () => api.get('/aggregator/filters'),
  getTaskDetail: (id) => api.get(`/aggregator/task/${id}`),
}