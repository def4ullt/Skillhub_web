import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reviewService, submissionReviewService } from '../../../services/reviewService'
import { taskService } from '../../../services/taskService'
import { getUserId } from '../../../auth/keycloak'

const sentimentColor = {
  Positive: 'text-emerald-400 border-emerald-500/30',
  Negative: 'text-red-400 border-red-500/30',
  Neutral: 'text-slate-400 border-white/10',
}

function TaskReviewCard({ review, navigate, taskName, onDelete }) {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-white font-medium">
            {review.user?.firstName} {review.user?.lastName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-yellow-400 text-xs">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </span>
            {review.sentiment && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${sentimentColor[review.sentiment] ?? sentimentColor.Neutral}`}>
                {review.sentiment}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {review.taskId && (
            <button
              onClick={() => navigate(`/tasks/${review.taskId}`)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              → Task
            </button>
          )}
          <span className="text-xs text-slate-600">
            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
          </span>
          <button
            onClick={() => onDelete(review.id)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      {taskName && (
        <p className="text-xs text-slate-500 mb-2 truncate">Task: <span className="text-slate-400">{taskName}</span></p>
      )}
      <p className="text-slate-400 text-sm leading-relaxed">{review.comment}</p>
      {review.keyIssues?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.keyIssues.map((kw, i) => (
            <span key={i} className="text-xs text-slate-500 bg-slate-800 rounded px-2 py-0.5">{kw}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionReviewCard({ review, navigate, onDelete }) {
  const shortId = review.submissionId ? review.submissionId.slice(0, 8) + '…' : null
  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-white font-medium">
          {review.mentor?.firstName} {review.mentor?.lastName}
          <span className="ml-2 text-xs text-violet-400">mentor</span>
        </p>
        <div className="flex items-center gap-3">
          {review.submissionId && (
            <button
              onClick={() => navigate(`/submissions/${review.submissionId}`)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              → Submission
            </button>
          )}
          <span className="text-xs text-slate-600">
            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
          </span>
          <button
            onClick={() => onDelete(review.id)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      {shortId && (
        <p className="text-xs text-slate-500 mb-2">Submission: <span className="text-slate-400 font-mono">{shortId}</span></p>
      )}
      <p className="text-slate-400 text-sm leading-relaxed">{review.feedback}</p>
    </div>
  )
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState('task')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const currentUserId = getUserId()

  const deleteTaskReview = useMutation({
    mutationFn: (id) => reviewService.delete(id, currentUserId, true),
    onSuccess: () => {
      qc.invalidateQueries(['admin-task-reviews'])
      qc.invalidateQueries(['all-reviews-health'])
    },
  })

  const deleteSubReview = useMutation({
    mutationFn: (id) => submissionReviewService.delete(id),
    onSuccess: () => qc.invalidateQueries(['admin-submission-reviews']),
  })

  const { data: taskReviewsData, isLoading: loadingTask } = useQuery({
    queryKey: ['admin-task-reviews', page],
    queryFn: () => reviewService.getAll({ pageNumber: page, pageSize: 20 }).then(r => r.data),
    enabled: tab === 'task',
  })

  const { data: subReviewsData, isLoading: loadingSub } = useQuery({
    queryKey: ['admin-submission-reviews', page],
    queryFn: () => submissionReviewService.getAll({ pageNumber: page, pageSize: 20 }).then(r => r.data),
    enabled: tab === 'submission',
  })

  const { data: allTasksData } = useQuery({
    queryKey: ['all-tasks-map'],
    queryFn: () => taskService.getAll({ pageSize: 100 }).then(r => r.data),
  })

  const taskMap = {}
  ;(allTasksData?.items ?? []).forEach(t => { taskMap[t.id] = t.title })

  const taskReviews = taskReviewsData?.items ?? []
  const subReviews = subReviewsData?.items ?? []
  const isLoading = tab === 'task' ? loadingTask : loadingSub
  const currentData = tab === 'task' ? taskReviewsData : subReviewsData

  const q = search.trim().toLowerCase()
  const filteredTaskReviews = q
    ? taskReviews.filter(r => {
        const userName = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.toLowerCase()
        const comment = (r.comment ?? '').toLowerCase()
        const taskName = (taskMap[r.taskId] ?? '').toLowerCase()
        const keywords = (r.keyIssues ?? []).join(' ').toLowerCase()
        return userName.includes(q) || comment.includes(q) || taskName.includes(q) || keywords.includes(q)
      })
    : taskReviews

  const filteredSubReviews = q
    ? subReviews.filter(r => {
        const mentorName = `${r.mentor?.firstName ?? ''} ${r.mentor?.lastName ?? ''}`.toLowerCase()
        const feedback = (r.feedback ?? '').toLowerCase()
        return mentorName.includes(q) || feedback.includes(q)
      })
    : subReviews

  // aggregate keyword frequency across all fetched task reviews
  const keywordFreq = {}
  taskReviews.forEach(r => {
    (r.keyIssues ?? []).forEach(kw => {
      keywordFreq[kw] = (keywordFreq[kw] ?? 0) + 1
    })
  })
  const topKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Reviews</h1>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          {[
            { key: 'task', label: 'Task Reviews' },
            { key: 'submission', label: 'Submission Feedback' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); setSearch('') }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                tab === t.key
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or text..."
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-56 transition-colors"
        />
        {q && (
          <span className="text-xs text-slate-500">
            {tab === 'task' ? filteredTaskReviews.length : filteredSubReviews.length} result{(tab === 'task' ? filteredTaskReviews : filteredSubReviews).length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {tab === 'task' && topKeywords.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Top Keywords (this page)</p>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(([word, count]) => (
              <span
                key={word}
                className="flex items-center gap-1.5 text-xs bg-slate-800 rounded-full px-3 py-1"
              >
                <span className="text-slate-300">{word}</span>
                <span className="text-violet-400 font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : tab === 'task' ? (
        <div className="space-y-3">
          {filteredTaskReviews.length === 0
            ? <p className="text-slate-600 text-sm">{q ? 'No reviews match your search.' : 'No task reviews.'}</p>
            : filteredTaskReviews.map(r => (
                <TaskReviewCard
                  key={r.id}
                  review={r}
                  navigate={navigate}
                  taskName={taskMap[r.taskId] ?? null}
                  onDelete={(id) => deleteTaskReview.mutate(id)}
                />
              ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubReviews.length === 0
            ? <p className="text-slate-600 text-sm">{q ? 'No feedback matches your search.' : 'No submission feedback.'}</p>
            : filteredSubReviews.map(r => (
                <SubmissionReviewCard
                  key={r.id}
                  review={r}
                  navigate={navigate}
                  onDelete={(id) => deleteSubReview.mutate(id)}
                />
              ))}
        </div>
      )}

      {(currentData?.hasPrevious || currentData?.hasNext) && (
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!currentData?.hasPrevious}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">Page {currentData?.currentPage} of {currentData?.totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!currentData?.hasNext}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
