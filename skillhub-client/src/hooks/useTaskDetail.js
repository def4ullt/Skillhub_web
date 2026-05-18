import { useQuery } from '@tanstack/react-query'
import { taskService } from '../services/taskService'

export const useTaskDetail = (id) =>
  useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.getById(id).then(r => r.data),
    enabled: !!id,
    retry: false,
  })