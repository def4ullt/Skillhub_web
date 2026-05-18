import { useParams, useNavigate } from 'react-router-dom'
import { useSubmissionDetail } from '../../hooks/useSubmissions'

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: sub, isLoading, isError } = useSubmissionDetail(id)

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

        <div>
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
                    href={file.fileUrl}
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

      </div>
    </div>
  )
}