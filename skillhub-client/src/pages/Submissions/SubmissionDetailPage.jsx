import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSubmissionDetail, useSubmissionStatuses } from '../../hooks/useSubmissions'
import { submissionReviewService } from '../../services/reviewService'
import { workSubmissionService } from '../../services/workService'
import keycloak, { getRole, getUserId } from '../../auth/keycloak'

const STATUS_COLORS = {
  Pending: 'text-yellow-400',
  Approved: 'text-emerald-400',
  Rejected: 'text-red-400',
  InReview: 'text-blue-400',
  Completed: 'text-violet-400',
}

function FeedbackForm({ submissionId, taskId, onSuccess }) {
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const currentUserId = getUserId()

  const handleSubmit = async () => {
    setError(null)
    if (!feedback.trim()) return setError('Feedback is required')
    setLoading(true)
    try {
      await submissionReviewService.create({
        submissionId,
        taskId,
        feedback,
        mentor: {
          userId: currentUserId,
          firstName: keycloak.tokenParsed?.given_name ?? 'Mentor',
          lastName: keycloak.tokenParsed?.family_name ?? '',
        },
      })
      onSuccess()
    } catch {
      setError('Failed to submit feedback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Write your feedback for the student..."
        rows={4}
        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {loading ? 'Submitting...' : 'Send Feedback'}
      </button>
    </div>
  )
}

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = getRole()
  const currentUserId = getUserId()
  const queryClient = useQueryClient()
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  const { data: sub, isLoading, isError } = useSubmissionDetail(id)
  const { data: statuses } = useSubmissionStatuses()

  const { data: feedbackData, refetch: refetchFeedback } = useQuery({
    queryKey: ['submission-feedback', id],
    queryFn: () => submissionReviewService.getAll({ submissionId: id, pageSize: 50 }).then(r => r.data),
    enabled: !!id,
  })

  const feedbackList = feedbackData?.items ?? []
  const isMentor = role === 'mentor' || role === 'admin'
  const hasFeedback = feedbackList.some(f => f.mentor?.userId?.toString() === currentUserId?.toString())

  const updateStatus = useMutation({
    mutationFn: ({ statusId }) =>
      workSubmissionService.update(id, {
        statusId,
        approverId: currentUserId,
        isAdmin: role === 'admin' || role === 'mentor',
      }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] })
    },
  })

  const getStatusId = (name) => statuses?.find(s => s.name === name)?.id

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

  const currentStatus = sub.workSubmissionStatus?.name ?? 'Unknown'
  const canChangeStatus = role === 'admin' || (role === 'mentor' && currentStatus !== 'Completed')
  const isLocked = role === 'mentor' && currentStatus === 'Completed'

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
            <span className={`text-xs ${STATUS_COLORS[currentStatus] ?? 'text-slate-400'}`}>
              {currentStatus}
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            {sub.userFirstName} {sub.userLastName}
          </p>

          <div className="flex gap-3 flex-wrap">
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

        {/* Files */}
        <div className="mb-8">
          <p className="text-xs text-slate-500 mb-3">Files ({sub.files?.length ?? 0})</p>
          {!sub.files?.length ? (
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

        {/* Status controls */}
        {canChangeStatus && statuses && (
          <div className="mb-8 space-y-3">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => updateStatus.mutate({ statusId: getStatusId('Approved') })}
                disabled={updateStatus.isPending || currentStatus === 'Approved'}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                {updateStatus.isPending ? '...' : 'Approve'}
              </button>
              <button
                onClick={() => updateStatus.mutate({ statusId: getStatusId('Rejected') })}
                disabled={updateStatus.isPending || currentStatus === 'Rejected'}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                {updateStatus.isPending ? '...' : 'Reject'}
              </button>
              <button
                onClick={() => updateStatus.mutate({ statusId: getStatusId('InReview') })}
                disabled={updateStatus.isPending || currentStatus === 'InReview'}
                className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-40 text-white text-sm transition-colors"
              >
                {updateStatus.isPending ? '...' : 'Mark In Review'}
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => updateStatus.mutate({ statusId: getStatusId('Completed') })}
                  disabled={updateStatus.isPending || currentStatus === 'Completed'}
                  className="px-5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  {updateStatus.isPending ? '...' : 'Mark Completed'}
                </button>
              )}
            </div>
            {updateStatus.isError && (
              <p className="text-red-400 text-xs">
                Failed to update status. {updateStatus.error?.response?.data?.error ?? ''}
              </p>
            )}
            {updateStatus.isSuccess && (
              <p className="text-emerald-400 text-xs">Status updated.</p>
            )}
          </div>
        )}
        {isLocked && (
          <div className="mb-8 px-4 py-2.5 rounded-lg bg-slate-900 border border-white/5 text-slate-500 text-xs">
            Status locked — submission is completed
          </div>
        )}

        {/* Mentor Feedback */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Mentor Feedback ({feedbackList.length})
            </h2>
            {isMentor && !hasFeedback && (
              <button
                onClick={() => setShowFeedbackForm(v => !v)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showFeedbackForm ? 'Cancel' : '+ Add Feedback'}
              </button>
            )}
          </div>

          {showFeedbackForm && isMentor && !hasFeedback && (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-4">
              <FeedbackForm
                submissionId={id}
                taskId={sub.taskId}
                onSuccess={() => { setShowFeedbackForm(false); refetchFeedback() }}
              />
            </div>
          )}

          {feedbackList.length === 0 ? (
            <p className="text-slate-600 text-sm">No feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {feedbackList.map(f => (
                <div key={f.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                  <p className="text-sm text-white font-medium mb-1">
                    {f.mentor?.firstName} {f.mentor?.lastName}
                    <span className="ml-2 text-xs text-violet-400">mentor</span>
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
