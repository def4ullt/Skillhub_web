import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aggregatorService } from '../services/aggregatorService'
import { reviewService } from '../services/reviewService'

export const useTaskDetail = (id) =>
  useQuery({
    queryKey: ['task-detail', id],
    queryFn: () => aggregatorService.getTaskDetail(id).then(r => r.data),
    enabled: !!id,
    retry: false,
  })

export const useCreateReview = (taskId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => reviewService.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-detail', taskId] }),
  })
}

export const useUpdateReview = (taskId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rating, comment, requestingUserId, isAdmin }) =>
      reviewService.update(id, { rating, comment, requestingUserId, isAdmin }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-detail', taskId] }),
  })
}

export const useDeleteReview = (taskId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, requestingUserId, isAdmin }) =>
      reviewService.delete(id, requestingUserId, isAdmin),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-detail', taskId] }),
  })
}
