import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workSubmissionService, submissionStatusService, submissionMethodService } from '../services/workService'

export const useSubmissions = (params) =>
  useQuery({
    queryKey: ['submissions', params],
    queryFn: () => workSubmissionService.getAll(params).then(r => r.data),
  })

export const useSubmissionDetail = (id) =>
  useQuery({
    queryKey: ['submission', id],
    queryFn: () => workSubmissionService.getById(id).then(r => r.data),
    enabled: !!id,
  })

export const useSubmissionStatuses = () =>
  useQuery({
    queryKey: ['submission-statuses'],
    queryFn: () => submissionStatusService.getAll().then(r => r.data),
  })

export const useSubmissionMethods = () =>
  useQuery({
    queryKey: ['submission-methods'],
    queryFn: () => submissionMethodService.getAll().then(r => r.data),
  })

export const useCreateSubmission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => workSubmissionService.create(data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
  })
}