import { useQuery } from '@tanstack/react-query'
import { taskService } from '../services/taskService'
import { aggregatorService } from '../services/aggregatorService'

export const useTasks = (params) =>
  useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getAll(params).then(r => r.data),
  })

export const useFilters = () =>
  useQuery({
    queryKey: ['filters'],
    queryFn: () => aggregatorService.getFilters().then(r => r.data),
  })