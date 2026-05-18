import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workSubmissionService, submissionStatusService } from '../../../services/workService'

const STATUS_COLORS = {
  Pending: 'text-yellow-400',
  Approved: 'text-green-400',
  Rejected: 'text-red-400',
  InReview: 'text-blue-400',
  Completed: 'text-violet-400',
}

export default function AdminSubmissionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-submissions', page],
    queryFn: () => workSubmissionService.getAll({ page, pageSize: 10 }).then(r => r.data),
  })

  const { data: statuses } = useQuery({
    queryKey: ['submission-statuses'],
    queryFn: () => submissionStatusService.getAll().then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, statusId }) => workSubmissionService.update(id, { statusId }),
    onSuccess: () => qc.invalidateQueries(['admin-submissions']),
  })

  const remove = useMutation({
  mutationFn: (id) => workSubmissionService.delete(id),
  onSuccess: () => qc.invalidateQueries(['admin-submissions']),
  })

  if (isLoading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Submissions</h2>
      </div>

      <div className="space-y-2">
        {data?.items?.map(sub => (
          <div key={sub.id} className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{sub.taskName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {sub.userFirstName} {sub.userLastName} · {new Date(sub.submissionDate).toLocaleDateString()}
                </p>
              </div>
                
              <div className="flex items-center gap-2">
                <select
                  value={sub.statusId}
                  onChange={e => updateStatus.mutate({ id: sub.id, statusId: e.target.value })}
                  className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {statuses?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => remove.mutate(sub.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
              
            <p className={`text-xs mt-1.5 ${STATUS_COLORS[statuses?.find(s => s.id === sub.statusId)?.name] ?? 'text-slate-400'}`}>
              {statuses?.find(s => s.id === sub.statusId)?.name ?? 'Unknown'}
            </p>
          </div>
        ))}
      </div>

      {data?.totalPages > 1 && (
        <div className="flex gap-2 mt-6">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                p === page ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}