import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { workSubmissionService, submissionStatusService } from '../../../services/workService'
import { useTaskHealthMap, HEALTH_COLOR, HEALTH_LABEL } from '../../../hooks/useTaskHealthMap'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

function useAnalytics() {
  const { data: statuses } = useQuery({
    queryKey: ['submission-statuses'],
    queryFn: () => submissionStatusService.getAll().then(r => r.data),
  })

  const { data: allSubmissions } = useQuery({
    queryKey: ['analytics-submissions'],
    queryFn: () => workSubmissionService.getAll({ pageNumber: 1, pageSize: 500 }).then(r => r.data),
  })

  const approvedStatus = statuses?.find(s => s.name === 'Approved')
  const rejectedStatus = statuses?.find(s => s.name === 'Rejected')
  const pendingStatus = statuses?.find(s => s.name === 'Pending')

  const items = allSubmissions?.items ?? []

  const approved = items.filter(s => s.statusId === approvedStatus?.id).length
  const rejected = items.filter(s => s.statusId === rejectedStatus?.id).length
  const pending = items.filter(s => s.statusId === pendingStatus?.id).length
  const total = items.length

  const byTask = {}
  items.forEach(s => {
    if (!byTask[s.taskId]) {
      byTask[s.taskId] = { id: s.taskId, name: s.taskName, approved: 0, rejected: 0, pending: 0, total: 0 }
    }
    byTask[s.taskId].total++
    if (s.statusId === approvedStatus?.id) byTask[s.taskId].approved++
    if (s.statusId === rejectedStatus?.id) byTask[s.taskId].rejected++
    if (s.statusId === pendingStatus?.id) byTask[s.taskId].pending++
  })

  return { approved, rejected, pending, total, byTask: Object.values(byTask) }
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function TaskAnalyticsPage() {
  const { approved, rejected, pending, total, byTask } = useAnalytics()
  const healthMap = useTaskHealthMap()
  const navigate = useNavigate()

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  const pieData = [
    { name: 'Approved', value: approved },
    { name: 'Pending', value: pending },
    { name: 'Rejected', value: rejected },
  ].filter(d => d.value > 0)

  const barData = byTask
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(t => ({
      name: t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name,
      Approved: t.approved,
      Pending: t.pending,
      Rejected: t.rejected,
    }))

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-6">Analytics</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {[
          { label: 'Total', value: total, color: 'text-white' },
          { label: 'Approved', value: approved, color: 'text-emerald-400' },
          { label: 'Rejected', value: rejected, color: 'text-red-400' },
          { label: 'Pending', value: pending, color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Approval rate */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-400">Approval rate</p>
          <p className="text-sm font-semibold text-emerald-400">{approvalRate}%</p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all"
            style={{ width: `${approvalRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar chart by task */}
        {barData.length > 0 && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Task (top 8)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="Approved" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Rejected" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed table */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">All Tasks</h3>
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        {byTask.length === 0 ? (
          <p className="text-slate-500 text-sm p-5">No submissions yet.</p>
        ) : (
          byTask
            .sort((a, b) => b.total - a.total)
            .map((t, i) => {
              const rate = t.total > 0 ? Math.round((t.approved / t.total) * 100) : 0
              const healthInfo = healthMap[t.id]
              const health = healthInfo?.health ?? 'Neutral'
              return (
                <div
                  key={i}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  className={`px-5 py-4 cursor-pointer hover:bg-slate-800/50 transition-colors ${i < byTask.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{t.name}</p>
                      <span className={`text-xs shrink-0 ${HEALTH_COLOR[health]}`}>{HEALTH_LABEL[health]}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {healthInfo && <span className="text-slate-500">{healthInfo.count} rev</span>}
                      <span className="text-slate-400">{t.total} subs</span>
                      <span className={`font-semibold ${rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {rate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald-400">{t.approved} approved</span>
                    <span className="text-red-400">{t.rejected} rejected</span>
                    <span className="text-yellow-400">{t.pending} pending</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 flex overflow-hidden">
                    {t.approved > 0 && (
                      <div className="bg-emerald-500 h-full" style={{ width: `${(t.approved/t.total)*100}%` }} />
                    )}
                    {t.pending > 0 && (
                      <div className="bg-yellow-500 h-full" style={{ width: `${(t.pending/t.total)*100}%` }} />
                    )}
                    {t.rejected > 0 && (
                      <div className="bg-red-500 h-full" style={{ width: `${(t.rejected/t.total)*100}%` }} />
                    )}
                  </div>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
