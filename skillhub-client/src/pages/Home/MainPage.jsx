import { useNavigate } from 'react-router-dom'
import keycloak, { getRole, getUserId } from '../../auth/keycloak'
import { useSubmissions } from '../../hooks/useSubmissions'
import { useLeaderboard, useUserXpTotal } from '../../hooks/useUserXp'

const XP_PER_LEVEL = 500

function XpProgressBar({ totalXp }) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpInLevel = totalXp % XP_PER_LEVEL
  const pct = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100)

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Level</p>
          <p className="text-2xl font-bold text-violet-400">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-0.5">Total XP</p>
          <p className="text-lg font-semibold text-white">{totalXp}</p>
        </div>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div
          className="bg-violet-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1.5">{xpInLevel} / {XP_PER_LEVEL} XP to level {level + 1}</p>
    </div>
  )
}

const STATUS_COLORS = {
  Pending: 'text-yellow-400',
  Approved: 'text-emerald-400',
  Rejected: 'text-red-400',
  InReview: 'text-blue-400',
  Completed: 'text-violet-400',
}

export default function MainPage() {
  const navigate = useNavigate()
  const name = keycloak.tokenParsed?.given_name ?? keycloak.tokenParsed?.preferred_username ?? 'User'
  const role = getRole()
  const currentUserId = getUserId()

  const { data: mySubmissions } = useSubmissions(
    currentUserId ? { userId: currentUserId, pageNumber: 1, pageSize: 5, sortDescending: true } : null
  )
  const { data: leaderboard } = useLeaderboard({ pageNumber: 1, pageSize: 5 })
  const { data: totalXp = 0 } = useUserXpTotal(currentUserId)

  const recent = mySubmissions?.items ?? []
  const top5 = leaderboard?.items ?? []

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="text-violet-400">{name}</span>
          </h1>
          <p className="text-slate-400 text-sm capitalize">{role} account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            <XpProgressBar totalXp={totalXp} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Submissions</h2>
                <button
                  onClick={() => navigate('/submissions')}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  View all →
                </button>
              </div>

              {recent.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 text-center">
                  <p className="text-slate-500 text-sm">No submissions yet.</p>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Browse tasks →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => navigate(`/submissions/${sub.id}`)}
                      className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-violet-500/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm text-white">{sub.taskName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(sub.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs ${STATUS_COLORS[sub.statusName] ?? 'text-slate-400'}`}>
                        {sub.statusName ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — mini leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Top Students</h2>
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Full →
              </button>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
              {top5.length === 0 ? (
                <p className="text-slate-500 text-sm p-5">No data yet.</p>
              ) : (
                top5.map((entry, i) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-4 py-3 ${i < top5.length - 1 ? 'border-b border-white/5' : ''} ${entry.userId === currentUserId ? 'bg-violet-600/10' : ''}`}
                  >
                    <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {entry.firstName} {entry.lastName}
                        {entry.userId === currentUserId && <span className="text-violet-400 text-xs ml-1">(you)</span>}
                      </p>
                    </div>
                    <span className="text-xs text-violet-400 font-semibold shrink-0">{entry.totalXp} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
