import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { workSubmissionService, submissionStatusService } from '../../../services/workService'
import { reviewService } from '../../../services/reviewService'
import { taskService } from '../../../services/taskService'
import { getKeycloakUsers } from '../../../utils/keycloak'

function useActivityLog() {
  const { data: statuses } = useQuery({
    queryKey: ['submission-statuses'],
    queryFn: () => submissionStatusService.getAll().then(r => r.data),
  })

  const { data: submissionsData } = useQuery({
    queryKey: ['activity-submissions'],
    queryFn: () => workSubmissionService.getAll({ pageNumber: 1, pageSize: 500 }).then(r => r.data),
    staleTime: 30 * 1000,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['activity-reviews'],
    queryFn: () => reviewService.getAll({ pageNumber: 1, pageSize: 500 }).then(r => r.data),
    staleTime: 30 * 1000,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['activity-tasks'],
    queryFn: () => taskService.getAll({ page: 1, pageSize: 500 }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const { data: kcUsers } = useQuery({
    queryKey: ['kc-users'],
    queryFn: () => getKeycloakUsers(),
    staleTime: 5 * 60 * 1000,
  })

  const statusMap = {}
  ;(statuses ?? []).forEach(s => { statusMap[s.id] = s.name })

  const taskNameMap = {}
  ;(tasksData?.items ?? []).forEach(t => { taskNameMap[t.id] = t.title })

  const kcNameMap = {}
  ;(kcUsers ?? []).forEach(u => {
    kcNameMap[u.id] = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Admin'
  })

  const events = []

  ;(submissionsData?.items ?? []).forEach(s => {
    events.push({
      type: 'submission',
      date: new Date(s.submissionDate),
      user: `${s.userFirstName ?? ''} ${s.userLastName ?? ''}`.trim() || 'Unknown',
      userId: s.userId,
      task: s.taskName ?? taskNameMap[s.taskId] ?? 'Unknown task',
      taskId: s.taskId,
      status: statusMap[s.statusId] ?? s.statusName ?? '—',
      id: s.id,
    })

    if (s.reviewedAt) {
      const reviewerName = s.reviewedBy ? (kcNameMap[s.reviewedBy] ?? 'Admin') : 'Admin'
      events.push({
        type: 'admin-review',
        date: new Date(s.reviewedAt),
        user: reviewerName,
        userId: s.reviewedBy,
        task: s.taskName ?? taskNameMap[s.taskId] ?? 'Unknown task',
        taskId: s.taskId,
        status: statusMap[s.statusId] ?? s.statusName ?? '—',
        submissionUser: `${s.userFirstName ?? ''} ${s.userLastName ?? ''}`.trim() || 'user',
        id: `admin-${s.id}`,
      })
    }
  })

  ;(reviewsData?.items ?? []).forEach(r => {
    if (!r.createdAt) return
    events.push({
      type: 'review',
      date: new Date(r.createdAt),
      user: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || 'Unknown',
      userId: r.user?.userId,
      task: taskNameMap[r.taskId] ?? 'Unknown task',
      taskId: r.taskId,
      rating: r.rating,
      sentiment: r.sentiment,
      comment: r.comment,
      id: r.id,
    })
  })

  ;(tasksData?.items ?? []).forEach(t => {
    if (!t.createdAt) return
    const authorName = t.authorId ? (kcNameMap[t.authorId] ?? '—') : '—'
    events.push({
      type: 'task',
      date: new Date(t.createdAt),
      user: authorName,
      userId: t.authorId,
      task: t.title,
      taskId: t.id,
      id: `task-${t.id}`,
    })
  })

  events.sort((a, b) => b.date - a.date)
  return events
}

const STATUS_COLOR = {
  Approved:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Rejected:  'text-red-400 bg-red-500/10 border-red-500/20',
  Pending:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  InReview:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Completed: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
}

const SENTIMENT_COLOR = {
  Positive: 'text-emerald-400',
  Negative: 'text-red-400',
  Neutral:  'text-slate-400',
}

const ALL_STATUSES = ['Pending', 'InReview', 'Approved', 'Rejected', 'Completed']
const ALL_SENTIMENTS = ['Positive', 'Neutral', 'Negative']

function formatDate(date) {
  const now = new Date()
  const diff = now - date
  if (diff < 60_000)        return 'just now'
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function matchesDate(date, filter) {
  const now = new Date()
  if (filter === 'today')  return date.toDateString() === now.toDateString()
  if (filter === 'week')   return date >= new Date(now - 7  * 86_400_000)
  if (filter === 'month')  return date >= new Date(now - 30 * 86_400_000)
  return true
}

function exportTxt(events) {
  const lines = events.map(ev => {
    const d = ev.date.toLocaleString('en-GB')
    if (ev.type === 'submission')
      return `[${d}]  SUBMISSION  |  ${ev.user}  →  "${ev.task}"  |  ${ev.status}`
    if (ev.type === 'review') {
      const stars = '★'.repeat(ev.rating) + '☆'.repeat(5 - ev.rating)
      return `[${d}]  REVIEW      |  ${ev.user}  →  "${ev.task}"  |  ${stars}  ${ev.sentiment ?? ''}`
    }
    if (ev.type === 'admin-review')
      return `[${d}]  ADMIN       |  ${ev.user}  →  "${ev.task}"  |  ${ev.submissionUser}  →  ${ev.status}`
    return `[${d}]  TASK        |  ${ev.user !== '—' ? ev.user + '  created  ' : 'Created  '}"${ev.task}"`
  })
  const header = `Activity Log Export\nGenerated: ${new Date().toLocaleString('en-GB')}\nTotal: ${events.length}\n${'='.repeat(70)}\n\n`
  const blob = new Blob([header + lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminActivityPage() {
  const navigate = useNavigate()
  const events = useActivityLog()

  const [typeFilter,      setTypeFilter]      = useState('all')
  const [dateFilter,      setDateFilter]      = useState('all')
  const [userSearch,      setUserSearch]      = useState('')
  const [taskSearch,      setTaskSearch]      = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')

  const filtered = useMemo(() => events.filter(ev => {
    if (typeFilter !== 'all' && ev.type !== typeFilter) return false
    if (!matchesDate(ev.date, dateFilter)) return false
    if (userSearch && !ev.user.toLowerCase().includes(userSearch.toLowerCase())) return false
    if (taskSearch && !ev.task.toLowerCase().includes(taskSearch.toLowerCase())) return false
    if (ev.type === 'submission' && statusFilter !== 'all' && ev.status !== statusFilter) return false
    if (ev.type === 'review'    && sentimentFilter !== 'all' && ev.sentiment !== sentimentFilter) return false
    return true
  }), [events, typeFilter, dateFilter, userSearch, taskSearch, statusFilter, sentimentFilter])

  const hasActiveFilter = typeFilter !== 'all' || dateFilter !== 'all' || userSearch || taskSearch || statusFilter !== 'all' || sentimentFilter !== 'all'

  const clearAll = () => {
    setTypeFilter('all'); setDateFilter('all')
    setUserSearch(''); setTaskSearch('')
    setStatusFilter('all'); setSentimentFilter('all')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Activity Log</h2>
        <button
          onClick={() => exportTxt(filtered)}
          disabled={filtered.length === 0}
          className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/40 disabled:opacity-30 transition-colors"
        >
          ↓ Export TXT
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-4 mb-5 space-y-3">

        {/* Type + Date row */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            {[
              { label: 'All',          value: 'all' },
              { label: 'Submissions',  value: 'submission' },
              { label: 'Reviews',      value: 'review' },
              { label: 'Tasks',        value: 'task' },
              { label: 'Admin Actions',value: 'admin-review' },
            ].map(f => (
              <button key={f.value} onClick={() => { setTypeFilter(f.value); setStatusFilter('all'); setSentimentFilter('all') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === f.value ? 'bg-violet-600 text-white' : 'text-slate-400 border border-white/10 hover:text-white'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto">
            {[
              { label: 'Today',  value: 'today' },
              { label: 'Week',   value: 'week'  },
              { label: 'Month',  value: 'month' },
              { label: 'All',    value: 'all'   },
            ].map(f => (
              <button key={f.value} onClick={() => setDateFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === f.value ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-filters for submissions */}
        {(typeFilter === 'submission' || typeFilter === 'all') && (
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-slate-600 self-center mr-1">Status:</span>
            <button onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              Any
            </button>
            {ALL_STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${statusFilter === s ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Sub-filters for reviews */}
        {(typeFilter === 'review' || typeFilter === 'all') && (
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-slate-600 self-center mr-1">Sentiment:</span>
            <button onClick={() => setSentimentFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${sentimentFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              Any
            </button>
            {ALL_SENTIMENTS.map(s => (
              <button key={s} onClick={() => setSentimentFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${sentimentFilter === s ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Search row */}
        <div className="flex gap-2 flex-wrap">
          <input
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder="Filter by user..."
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-44"
          />
          <input
            value={taskSearch}
            onChange={e => setTaskSearch(e.target.value)}
            placeholder="Filter by task..."
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-44"
          />
          <div className="flex items-center gap-3 ml-auto">
            {hasActiveFilter && (
              <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Clear all
              </button>
            )}
            <span className="text-xs text-slate-600">{filtered.length} events</span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">No matching activity.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev, i) => (
            <div
              key={`${ev.type}-${ev.id ?? i}`}
              className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 flex items-start gap-4"
            >
              <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                ev.type === 'submission'   ? 'bg-blue-500/15 text-blue-400' :
                ev.type === 'review'       ? 'bg-yellow-500/15 text-yellow-400' :
                ev.type === 'admin-review' ? 'bg-emerald-500/15 text-emerald-400' :
                'bg-violet-500/15 text-violet-400'
              }`}>
                {ev.type === 'submission' ? '↑' : ev.type === 'review' ? '★' : ev.type === 'admin-review' ? '✓' : '+'}
              </div>

              <div className="flex-1 min-w-0">
                {ev.type === 'submission' && (
                  <>
                    <p className="text-sm text-white">
                      <span
                        className="font-medium cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={() => setUserSearch(ev.user)}
                      >{ev.user}</span>
                      <span className="text-slate-400"> submitted </span>
                      <span
                        className="text-slate-300 italic cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={() => ev.taskId && navigate(`/tasks/${ev.taskId}`)}
                      >"{ev.task}"</span>
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[ev.status] ?? 'text-slate-400 border-white/10'}`}>
                      {ev.status}
                    </span>
                  </>
                )}

                {ev.type === 'review' && (
                  <>
                    <p className="text-sm text-white">
                      <span
                        className="font-medium cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={() => setUserSearch(ev.user)}
                      >{ev.user}</span>
                      <span className="text-slate-400"> reviewed </span>
                      <span
                        className="text-slate-300 italic cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={() => ev.taskId && navigate(`/tasks/${ev.taskId}`)}
                      >"{ev.task}"</span>
                      <span className="text-slate-400"> — </span>
                      <span className="text-yellow-400">{'★'.repeat(ev.rating)}{'☆'.repeat(5 - ev.rating)}</span>
                      {ev.sentiment && (
                        <span className={`ml-2 text-xs ${SENTIMENT_COLOR[ev.sentiment] ?? 'text-slate-400'}`}>{ev.sentiment}</span>
                      )}
                    </p>
                    {ev.comment && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{ev.comment}</p>
                    )}
                  </>
                )}

                {ev.type === 'task' && (
                  <p className="text-sm text-white">
                    {ev.user && ev.user !== '—' ? (
                      <>
                        <span
                          className="font-medium cursor-pointer hover:text-violet-400 transition-colors"
                          onClick={() => setUserSearch(ev.user)}
                        >{ev.user}</span>
                        <span className="text-slate-400"> created task </span>
                      </>
                    ) : (
                      <span className="text-slate-400">Task created: </span>
                    )}
                    <span
                      className="text-slate-300 italic cursor-pointer hover:text-violet-400 transition-colors"
                      onClick={() => ev.taskId && navigate(`/tasks/${ev.taskId}`)}
                    >"{ev.task}"</span>
                  </p>
                )}

                {ev.type === 'admin-review' && (
                  <>
                    <p className="text-sm text-white">
                      <span
                        className="font-medium cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={() => setUserSearch(ev.user)}
                      >{ev.user}</span>
                      <span className="text-slate-400"> marked </span>
                      <span className="text-slate-300">{ev.submissionUser}</span>
                      <span className="text-slate-400">'s submission on </span>
                      <span
                        className="text-slate-300 italic cursor-pointer hover:text-violet-400 transition-colors"
                        onClick={() => ev.taskId && navigate(`/tasks/${ev.taskId}`)}
                      >"{ev.task}"</span>
                      <span className="text-slate-400"> as </span>
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[ev.status] ?? 'text-slate-400 border-white/10'}`}>
                      {ev.status}
                    </span>
                  </>
                )}
              </div>

              <span className="text-xs text-slate-600 shrink-0 mt-0.5 whitespace-nowrap">{formatDate(ev.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
