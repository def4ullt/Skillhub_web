import { useQuery, useMutation } from '@tanstack/react-query'
import { userXpService } from '../services/workService'

export const useLeaderboard = (params) =>
  useQuery({
    queryKey: ['leaderboard', params],
    queryFn: () => userXpService.getLeaderboard(params).then(r => r.data),
  })

export const useUserXpHistory = (userId) =>
  useQuery({
    queryKey: ['user-xp', userId],
    queryFn: () => userXpService.getByUser(userId).then(r => r.data),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

export const useUserXpTotal = (userId) =>
  useQuery({
    queryKey: ['user-xp-total', userId],
    queryFn: () => userXpService.getTotalByUser(userId).then(r => r.data),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

export const useAllUsers = (params) =>
  useQuery({
    queryKey: ['all-users', params],
    queryFn: () => userXpService.getAllUsers(params).then(r => r.data),
  })

export const useAdjustXp = () =>
  useMutation({
    mutationFn: (data) => userXpService.adjust(data),
  })

export const useRenameUser = () =>
  useMutation({
    mutationFn: ({ userId, firstName, lastName }) => userXpService.rename(userId, { firstName, lastName }),
  })
