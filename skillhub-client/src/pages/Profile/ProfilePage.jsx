import keycloak, { getRole, getUserId } from '../../auth/keycloak'
import { useUserXpHistory, useUserXpTotal } from '../../hooks/useUserXp'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const XP_PER_LEVEL = 500

function XpBar({ totalXp }) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpInLevel = totalXp % XP_PER_LEVEL
  const pct = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Level {level}</span>
        <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function buildChartData(history) {
  const sorted = [...history].sort((a, b) => new Date(a.earnedAt) - new Date(b.earnedAt))
  let cumulative = 0
  return sorted.map(entry => {
    cumulative += entry.xpAmount
    return {
      date: new Date(entry.earnedAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
      xp: cumulative,
    }
  })
}

export default function ProfilePage() {
  const currentUserId = getUserId()
  const name = keycloak.tokenParsed?.given_name
  const lastName = keycloak.tokenParsed?.family_name
  const email = keycloak.tokenParsed?.email
  const role = getRole()

  const { data: totalXp = 0 } = useUserXpTotal(currentUserId)
  const { data: history = [] } = useUserXpHistory(currentUserId)

  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const chartData = buildChartData(history)

  const completedTasks = history.filter(e => e.taskId && e.taskId !== '00000000-0000-0000-0000-000000000000')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

        {/* User card */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-5 mb-5">
            <div className="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
              {(name?.[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{name} {lastName}</h2>
              {email && <p className="text-sm text-slate-400">{email}</p>}
              <span className="mt-1 inline-block text-xs capitalize bg-slate-800 text-violet-400 border border-violet-500/20 rounded-full px-3 py-0.5">
                {role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">{totalXp}</p>
              <p className="text-xs text-slate-400 mt-1">Total XP</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{level}</p>
              <p className="text-xs text-slate-400 mt-1">Level</p>
            </div>
          </div>

          <XpBar totalXp={totalXp} />
        </div>

        {/* XP chart */}
        {chartData.length > 1 && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">XP Progress</h2>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#a78bfa' }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#xpGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Completed tasks */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Completed Tasks ({completedTasks.length})
          </h2>

          {completedTasks.length === 0 ? (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 text-center">
              <p className="text-slate-500 text-sm">No completed tasks yet. Get your submissions approved!</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
              {completedTasks.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < completedTasks.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div>
                    <p className="text-sm text-slate-300">{entry.taskName ?? 'Task completed'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(entry.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">+{entry.xpAmount} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
