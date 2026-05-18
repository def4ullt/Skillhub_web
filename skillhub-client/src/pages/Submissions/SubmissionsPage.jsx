import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSubmissions, useSubmissionStatuses } from '../../hooks/useSubmissions'
import { workSubmissionService } from '../../services/workService'
import { getRole, getUserId } from '../../auth/keycloak'

export default function SubmissionsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState({ pageNumber: 1, pageSize: 10, sortDescending: true })
  const [onlyMine, setOnlyMine] = useState(false)

  const currentUserId = getUserId()
  const role = getRole()

  const activeParams = onlyMine && currentUserId
    ? { ...params, userId: currentUserId }
    : params
  const { data, isLoading } = useSubmissions(activeParams)
  const { data: statuses } = useSubmissionStatuses()

  const setStatus = (statusId) => {
    setParams(p => {
      const next = { ...p, pageNumber: 1 }
      if (!statusId) delete next.statusId
      else next.statusId = statusId
      return next
    })
  }

  const qc = useQueryClient()
  const remove = useMutation({
    mutationFn: (id) => workSubmissionService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  })

  const filtered = data?.items ?? []

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Submissions</h1>
            <p className="text-slate-400 text-sm">{data?.totalCount ?? 0} submissions found</p>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="w-60 shrink-0 space-y-6">

            {/* My submissions toggle */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">View</label>
              <button
                onClick={() => setOnlyMine(v => !v)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  onlyMine ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                ✓ My submissions
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
              <div className="space-y-1">
                <button
                  onClick={() => setStatus(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !params.statusId ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                {statuses?.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      params.statusId === s.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Sort</label>
              <div className="space-y-1">
                <button
                  onClick={() => setParams(p => ({ ...p, sortDescending: true }))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    params.sortDescending ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Newest first
                </button>
                <button
                  onClick={() => setParams(p => ({ ...p, sortDescending: false }))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !params.sortDescending ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Oldest first
                </button>
              </div>
            </div>

          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="text-slate-500 text-sm">Loading...</div>
            ) : (
              <>
                <div className="space-y-3">
                  {filtered.map(sub => (
                    <div
                      key={sub.id}
                      className="bg-slate-900 border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/40 hover:shadow-xl hover:shadow-black/30"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/submissions/${sub.id}`)}
                        >
                          <p className="text-white font-semibold">{sub.taskName}</p>
                          <p className="text-slate-400 text-sm mt-0.5">
                            {sub.userFirstName} {sub.userLastName}
                          </p>
                        </div>
                        {(role === 'admin' || sub.userId === currentUserId) && (
                          <button
                            onClick={() => remove.mutate(sub.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {new Date(sub.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-8 text-sm text-slate-400">
                  <button
                    disabled={params.pageNumber <= 1}
                    onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber - 1 }))}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <span>Page {params.pageNumber} of {data?.totalPages ?? 1}</span>
                  <button
                    disabled={params.pageNumber >= (data?.totalPages ?? 1)}
                    onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber + 1 }))}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}