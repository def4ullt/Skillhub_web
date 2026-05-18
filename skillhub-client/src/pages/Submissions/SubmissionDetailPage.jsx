import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSubmissionDetail } from '../../hooks/useSubmissions'
import { reviewService } from '../../services/reviewService'
import keycloak, { getRole, getUserId } from '../../auth/keycloak'

function ReviewForm({ taskId, onSuccess }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const currentUserId = getUserId()

  const handleSubmit = async () => {
    setError(null)
    if (!comment.trim()) return setError('Comment is required')
    setLoading(true)
    try {
      await reviewService.create({
        taskId,
        rating,
        comment,
        user: {
          userId: currentUserId,
          firstName: keycloak.tokenParsed?.given_name ?? 'User',
          lastName: keycloak.tokenParsed?.family_name ?? '',
        },
      })
      onSuccess()
    } catch {
      setError('Failed to submit. You may have already reviewed this task.')
    } finally {
      setLoading(false)
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
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = getRole()
  const currentUserId = getUserId()
  const [showForm, setShowForm] = useState(false)

  const { data: sub, isLoading, isError } = useSubmissionDetail(id)

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ['task-reviews', sub?.taskId],
    queryFn: () => reviewService.getAll({ taskId: sub.taskId, pageSize: 50 }).then(r => r.data),
    enabled: !!sub?.taskId,
  })

  const reviews = reviewsData?.items ?? reviewsData ?? []
  const canReview = role === 'admin' || role === 'mentor'
  const hasReviewed = reviews.some(r => r.user?.userId?.toString() === currentUserId?.toString())

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Loading...
    </div>
  )

  if (isError) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
      Failed to load submission.
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </button>

        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-xl font-semibold text-white">{sub.taskName}</h1>
            <span className="text-xs text-violet-400">
              {sub.workSubmissionStatus?.name ?? 'Unknown'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            {sub.userFirstName} {sub.userLastName}
          </p>

          <div className="flex gap-3">
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="text-sm text-white">{new Date(sub.submissionDate).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => navigate(`/tasks/${sub.taskId}`)}
              className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-left hover:border-violet-500/30 transition-colors"
            >
              <p className="text-xs text-slate-500 mb-1">Task</p>
              <p className="text-sm text-violet-400">View →</p>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs text-slate-500 mb-3">Files ({sub.files.length})</p>

          {sub.files.length === 0 ? (
            <p className="text-slate-600 text-sm">No files attached.</p>
          ) : (
            <div className="space-y-2">
              {sub.files.map(file => (
                <div
                  key={file.id}
                  className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <span className="text-slate-400 text-sm truncate">{file.fileUrl}</span>
                  <a
                    href={file.fileUrl.startsWith('http') ? file.fileUrl : `https://${file.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 ml-4 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Open →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Reviews ({reviews.length})
            </h2>
            {canReview && !hasReviewed && (
              <button
                onClick={() => setShowForm(v => !v)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Leave Review'}
              </button>
            )}
          </div>

          {showForm && canReview && !hasReviewed && (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-4">
              <ReviewForm
                taskId={sub.taskId}
                onSuccess={() => { setShowForm(false); refetchReviews() }}
              />
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-slate-600 text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5">
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
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            review.sentiment === 'Positive' ? 'text-emerald-400 border-emerald-500/30' :
                            review.sentiment === 'Negative' ? 'text-red-400 border-red-500/30' :
                            'text-slate-400 border-white/10'
                          }`}>
                            {review.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{review.comment}</p>
                  {review.keyIssues?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {review.keyIssues.map((issue, i) => (
                        <span key={i} className="text-xs text-slate-500 bg-slate-800 rounded px-2 py-0.5">
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
