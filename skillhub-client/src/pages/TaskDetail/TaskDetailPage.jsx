import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTaskDetail, useCreateReview, useUpdateReview, useDeleteReview } from '../../hooks/useTaskDetail'
import SubmitTaskForm from '../../components/tasks/SubmitTaskForm'
import TaskFormModal from '../Admin/Tasks/TaskFormModal'
import keycloak, { getRole, getUserId } from '../../auth/keycloak'
import { getKeycloakUser } from '../../utils/keycloak'
import { tagService, technologyService } from '../../services/taskService'

const difficultyLabel = { 1: 'Junior', 2: 'Middle', 3: 'Senior' }
const difficultyColor = { 1: 'text-emerald-400', 2: 'text-yellow-400', 3: 'text-red-400' }

const STATUS_COLORS = {
  Pending: 'text-yellow-400',
  Approved: 'text-emerald-400',
  Rejected: 'text-red-400',
  InReview: 'text-blue-400',
  Completed: 'text-violet-400',
}

function ReviewForm({ taskId, onSuccess }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const { mutateAsync, isPending } = useCreateReview(taskId)
  const currentUserId = getUserId()

  const handleSubmit = async () => {
    setError(null)
    if (!comment.trim()) return setError('Comment is required')
    try {
      await mutateAsync({
        taskId,
        rating,
        comment,
        user: {
          userId: currentUserId,
          firstName: keycloak.tokenParsed?.given_name ?? 'User',
          lastName: keycloak.tokenParsed?.family_name ?? '',
        },
      })
      onSuccess?.()
    } catch {
      setError('Failed to submit review. You may have already reviewed this task.')
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400">Rating</label>
        <select
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500"
        >
          {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} ★</option>)}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Write your review..."
        rows={3}
        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {isPending ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

function ReviewCard({ review, currentUserId, isAdmin, taskId }) {
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(review.rating)
  const [comment, setComment] = useState(review.comment ?? '')

  const update = useUpdateReview(taskId)
  const remove = useDeleteReview(taskId)

  const isOwn = (review.user?.userId ?? review.userId)?.toString().toLowerCase() === currentUserId?.toString().toLowerCase()

  const handleSave = async () => {
    if (!comment.trim()) return
    await update.mutateAsync({ id: review.id, rating, comment, requestingUserId: currentUserId, isAdmin })
    setEditing(false)
  }

  const handleCancel = () => {
    setRating(review.rating)
    setComment(review.comment ?? '')
    setEditing(false)
  }

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-white font-medium">
            {review.user?.firstName} {review.user?.lastName}
          </p>
          {!editing && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-yellow-400 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              {review.sentiment && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  review.sentiment === 'Positive' ? 'text-emerald-400 border-emerald-500/30' :
                  review.sentiment === 'Negative' ? 'text-red-400 border-red-500/30' :
                  'text-slate-400 border-white/10'
                }`}>
                  {review.sentiment}
                </span>
              )}
            </div>
          )}
        </div>

        {(isOwn || isAdmin) && !editing && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-slate-500 hover:text-violet-400 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => remove.mutate({ id: review.id, requestingUserId: currentUserId, isAdmin })}
              disabled={remove.isPending}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 mt-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Rating</label>
            <select
              value={rating}
              onChange={e => setRating(Number(e.target.value))}
              className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} ★</option>)}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={update.isPending || !comment.trim()}
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm transition-colors"
            >
              {update.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-slate-400 text-sm leading-relaxed">{review.comment}</p>
          {review.keyIssues?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {review.keyIssues.map((issue, i) => (
                <span key={i} className="text-xs text-slate-500 bg-slate-800 rounded px-2 py-0.5">{issue}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: detail, isLoading, isError } = useTaskDetail(id)
  const role = getRole()
  const currentUserId = getUserId()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const task = detail?.task ?? detail
  const { data: authorUser } = useQuery({
    queryKey: ['keycloak-user', task?.authorId],
    queryFn: () => getKeycloakUser(task.authorId).then(res => res?.user ?? null),
    enabled: !!task?.authorId && task.authorId !== '00000000-0000-0000-0000-000000000000',
  })
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: () => tagService.getAll().then(r => r.data) })
  const { data: technologies } = useQuery({ queryKey: ['technologies'], queryFn: () => technologyService.getAll().then(r => r.data) })

  const authorName = authorUser
    ? `${authorUser.firstName ?? ''} ${authorUser.lastName ?? ''}`.trim() || null
    : null

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      Loading...
    </div>
  )

  if (isError) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-2">
      <p className="text-9xl font-semibold text-white">404</p>
      <p className="text-lg font-medium text-white">Task not found</p>
      <p className="text-sm text-slate-500">The task you're looking for doesn't exist</p>
      <button
        onClick={() => navigate('/tasks')}
        className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
      >
        ← Back to tasks
      </button>
    </div>
  )

  const submissions = detail?.workSubmissions ?? []
  const reviews = detail?.reviews ?? []

  const keywordFreq = {}
  reviews.forEach(r => {
    ;(r.keyIssues ?? []).forEach(kw => {
      keywordFreq[kw] = (keywordFreq[kw] ?? 0) + 1
    })
  })
  const topKeywords = Object.entries(keywordFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const positiveCount = reviews.filter(r => r.sentiment === 'Positive').length
  const negativeCount = reviews.filter(r => r.sentiment === 'Negative').length
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0
  const taskHealth = reviews.length === 0
    ? 'Neutral'
    : avgRating >= 4.0 ? 'Good' : avgRating >= 2.8 ? 'Neutral' : 'Poor'

  const hasReviewed = reviews.some(r => {
    const rId = (r.user?.userId ?? r.userId)?.toString().toLowerCase()
    return rId && rId === currentUserId?.toString().toLowerCase()
  })
  const canReview = !hasReviewed
  const canEdit = role === 'admin' || (task?.authorId && currentUserId === task.authorId?.toString())

  return (
    <>
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </button>

        {/* Task info */}
        <div className="mb-8">
          <span className={`text-xs ${difficultyColor[task.difficulty] ?? 'text-slate-400'} mb-3 block`}>
            {difficultyLabel[task.difficulty] ?? '—'}
          </span>
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-2xl font-semibold text-white">{task.title}</h1>
            {canEdit && (
              <button
                onClick={() => setEditOpen(true)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-white transition-colors"
              >
                Edit Task
              </button>
            )}
          </div>
          {authorName && (
            <p className="text-xs text-slate-500 mb-3">Created by {authorName}</p>
          )}
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{task.description}</p>

          <div className="flex gap-3 flex-wrap">
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Time</p>
              <p className="text-sm text-white">{task.estimatedTimeMinutes} min</p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">XP</p>
              <p className="text-sm text-violet-400 font-semibold">+{task.xpReward}</p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className={`text-sm ${task.isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                {task.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Health</p>
              <p className={`text-sm font-semibold ${
                taskHealth === 'Good' ? 'text-emerald-400' :
                taskHealth === 'Neutral' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {taskHealth === 'Good' ? '★ Good' : taskHealth === 'Neutral' ? '◆ Neutral' : '↓ Poor'}
              </p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Reviews</p>
              <p className="text-sm text-white">
                {reviews.length === 0
                  ? <span className="text-slate-600">none yet</span>
                  : <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400">{positiveCount}↑</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-red-400">{negativeCount}↓</span>
                    </span>
                }
              </p>
            </div>
          </div>

          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {task.tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => navigate(`/tasks?tagIds=${tag.id}`)}
                  className="text-xs text-slate-400 border border-white/10 rounded-lg px-2.5 py-1 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {task.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {task.technologies.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => navigate(`/tasks?technologyIds=${tech.id}`)}
                  className="text-xs text-violet-400 border border-violet-500/20 rounded-lg px-2.5 py-1 hover:border-violet-500/50 transition-colors"
                >
                  {tech.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit work */}
        <SubmitTaskForm task={task} />

        {/* Submissions for this task (admin/mentor) */}
        {(role === 'admin' || role === 'mentor') && submissions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Submissions ({submissions.length})
            </h2>
            <div className="space-y-2">
              {submissions.map(sub => (
                <div
                  key={sub.id}
                  className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-violet-500/30 transition-colors"
                  onClick={() => navigate(`/submissions/${sub.id}`)}
                >
                  <div>
                    <p className="text-sm text-white">{sub.userFirstName} {sub.userLastName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(sub.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs ${STATUS_COLORS[sub.statusName] ?? 'text-slate-400'}`}>
                    {sub.statusName ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Reviews ({reviews.length})
            </h2>
            {canReview && (
              <button
                onClick={() => setShowReviewForm(v => !v)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showReviewForm ? 'Cancel' : '+ Write Review'}
              </button>
            )}
          </div>

          {showReviewForm && canReview && (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-4">
              <ReviewForm taskId={id} onSuccess={() => setShowReviewForm(false)} />
            </div>
          )}

          {topKeywords.length > 0 && (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Top Keywords</p>
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(([word, count]) => (
                  <span key={word} className="flex items-center gap-1.5 text-xs bg-slate-800 rounded-full px-3 py-1">
                    <span className="text-slate-300">{word}</span>
                    <span className="text-violet-400 font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-slate-600 text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={currentUserId}
                  isAdmin={role === 'admin'}
                  taskId={id}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>

    {editOpen && (
      <TaskFormModal
        task={task}
        filters={{ tags: tags ?? [], technologies: technologies ?? [] }}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false)
          queryClient.invalidateQueries({ queryKey: ['task-detail', id] })
        }}
      />
    )}
    </>
  )
}
