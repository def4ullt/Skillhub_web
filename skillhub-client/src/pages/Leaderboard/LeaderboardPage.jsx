import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLeaderboard } from '../../hooks/useUserXp'
import { getUserId } from '../../auth/keycloak'
import { workSubmissionService, submissionStatusService } from '../../services/workService'

function useTopTasks() {
  const { data: statuses } = useQuery({
    queryKey: ['submission-statuses'],
    queryFn: () => submissionStatusService.getAll().then(r => r.data),
  })

  const { data: allSubmissions } = useQuery({
    queryKey: ['leaderboard-submissions'],
    queryFn: () => workSubmissionService.getAll({ pageNumber: 1, pageSize: 500 }).then(r => r.data),
  })

  const approvedId = statuses?.find(s => s.name === 'Approved')?.id
  const items = allSubmissions?.items ?? []

  const byTask = {}
  items.forEach(s => {
    if (!byTask[s.taskId]) byTask[s.taskId] = { taskName: s.taskName, total: 0, approved: 0 }
    byTask[s.taskId].total++
    if (s.statusId === approvedId) byTask[s.taskId].approved++
  })

  return Object.values(byTask)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(t => ({ ...t, approveRate: t.total > 0 ? Math.round((t.approved / t.total) * 100) : 0 }))
}

export default function LeaderboardPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useLeaderboard({ pageNumber: page, pageSize: 20 })
  const currentUserId = getUserId()
  const entries = data?.items ?? []
  const topTasks = useTopTasks()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">

        {/* Students leaderboard */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Leaderboard</h1>
            <p className="text-slate-400 text-sm">Top students ranked by earned XP</p>
          </div>

          {isLoading ? (
            <div className="text-slate-500 text-sm">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-slate-500 text-sm">No XP data yet. Complete tasks to appear here!</div>
          ) : (
            <>
              <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                {entries.map((entry, i) => {
                  const isMe = entry.userId === currentUserId
                  const rank = entry.rank
                  const medalColor =
                    rank === 1 ? 'text-yellow-400' :
                    rank === 2 ? 'text-slate-300' :
                    rank === 3 ? 'text-amber-600' :
                    'text-slate-500'

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 px-5 py-4 ${i < entries.length - 1 ? 'border-b border-white/5' : ''} ${isMe ? 'bg-violet-600/10' : ''}`}
                    >
                      <span className={`text-base font-bold w-7 text-center ${medalColor}`}>
                        {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">
                          {entry.firstName || 'Unknown'} {entry.lastName || ''}
                          {isMe && <span className="text-violet-400 text-xs ml-2">(you)</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-violet-400">{entry.totalXp} XP</p>
                        <p className="text-xs text-slate-500">Lv {Math.floor(entry.totalXp / 500) + 1}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between mt-6 text-sm text-slate-400">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span>Page {page} of {data?.totalPages ?? 1}</span>
                <button
                  disabled={page >= (data?.totalPages ?? 1)}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Top tasks */}
        {topTasks.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Top Tasks</h2>
              <p className="text-slate-400 text-sm">Most attempted tasks ranked by submission count</p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
              {topTasks.map((task, i) => (
                <div
                  key={i}
                  className={`px-5 py-4 ${i < topTasks.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-600 text-sm font-bold shrink-0">#{i + 1}</span>
                      <p className="text-sm text-white font-medium truncate">{task.taskName}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      <span className="text-slate-400">{task.total} submissions</span>
                      <span className={`font-semibold ${task.approveRate >= 70 ? 'text-emerald-400' : task.approveRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {task.approveRate}% approved
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${task.approveRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
