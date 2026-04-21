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
          className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors"
        >
          ← Back
        </button>

        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{sub.taskName}</h1>
              <p className="text-slate-400 text-sm">
                {sub.userFirstName} {sub.userLastName}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
              {sub.workSubmissionStatus?.name ?? 'Unknown'}
            </span>
          </div>

          <div className="flex gap-6 text-sm text-slate-400">
            <span>📅 {new Date(sub.submissionDate).toLocaleDateString()}</span>
            <button
              onClick={() => navigate(`/tasks/${sub.taskId}`)}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              View Task →
            </button>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Files <span className="text-slate-500 text-sm font-normal">({sub.files.length})</span>
          </h2>

          {sub.files.length === 0 ? (
            <p className="text-slate-500 text-sm">No files attached.</p>
          ) : (
            <div className="space-y-3">
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
                    className="shrink-0 ml-4 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    Open →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}