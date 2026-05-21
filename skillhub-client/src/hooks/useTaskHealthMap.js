import { useQuery } from '@tanstack/react-query'
import { reviewService } from '../services/reviewService'

export const HEALTH_COLOR = {
  Good: 'text-emerald-400',
  Neutral: 'text-yellow-400',
  Poor: 'text-red-400',
}

export const HEALTH_BORDER = {
  Good: 'border-emerald-500/30',
  Neutral: 'border-yellow-500/30',
  Poor: 'border-red-500/30',
}

export const HEALTH_LABEL = {
  Good: '★ Good',
  Neutral: '◆ Neutral',
  Poor: '↓ Poor',
}

export const computeHealth = (reviews) => {
  if (!reviews || reviews.length === 0) return 'Neutral'
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return avg >= 4.0 ? 'Good' : avg >= 2.8 ? 'Neutral' : 'Poor'
}

export function useTaskHealthMap() {
  const { data } = useQuery({
    queryKey: ['all-reviews-health'],
    queryFn: () => reviewService.getAll({ pageNumber: 1, pageSize: 500 }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const reviewsByTask = {}
  ;(data?.items ?? []).forEach(r => {
    if (!reviewsByTask[r.taskId]) reviewsByTask[r.taskId] = []
    reviewsByTask[r.taskId].push(r)
  })

  const healthMap = {}
  Object.entries(reviewsByTask).forEach(([taskId, reviews]) => {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    healthMap[taskId] = {
      health: computeHealth(reviews),
      avg: Math.round(avg * 10) / 10,
      count: reviews.length,
      positive: reviews.filter(r => r.sentiment === 'Positive').length,
      negative: reviews.filter(r => r.sentiment === 'Negative').length,
    }
  })

  return healthMap
}
