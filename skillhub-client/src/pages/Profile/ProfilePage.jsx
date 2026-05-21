import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import keycloak, { getRole, getUserId } from '../../auth/keycloak'
import { useUserXpHistory, useUserXpTotal } from '../../hooks/useUserXp'
import { workSubmissionService, userXpService } from '../../services/workService'
import { reviewService } from '../../services/reviewService'
import { compressImage, loadProfile, saveProfile } from '../../utils/userProfile'
import { useTaskHealthMap, HEALTH_COLOR, HEALTH_LABEL } from '../../hooks/useTaskHealthMap'
import { taskService } from '../../services/taskService'
import { getKeycloakUser } from '../../utils/keycloak'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

const XP_PER_LEVEL = 500

const STATUS_COLORS = {
  Pending: 'text-yellow-400',
  Approved: 'text-emerald-400',
  Rejected: 'text-red-400',
  InReview: 'text-blue-400',
  Completed: 'text-violet-400',
}

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

function LetterAvatar({ name, src, size = 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-10 h-10 text-sm'
  if (src) return <img src={src} alt="avatar" className={`${sizeClass} rounded-full object-cover`} />
  return (
    <div className={`${sizeClass} rounded-full bg-violet-600 flex items-center justify-center font-bold text-white`}>
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  )
}

export default function ProfilePage() {
  const { userId: paramUserId } = useParams()
  const navigate = useNavigate()
  const currentUserId = getUserId()
  const targetUserId = paramUserId ?? currentUserId
  const isOwnProfile = !paramUserId || paramUserId === currentUserId

  const role = getRole()
  const ownName = keycloak.tokenParsed?.given_name
  const ownLastName = keycloak.tokenParsed?.family_name
  const email = keycloak.tokenParsed?.email

  const [tab, setTab] = useState('tasks')
  const [bio, setBio] = useState('')
  const [bioInput, setBioInput] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [avatar, setAvatar] = useState(null)

  const { data: totalXp = 0 } = useUserXpTotal(targetUserId)
  const { data: history = [] } = useUserXpHistory(targetUserId)

  const { data: otherUserEntries } = useQuery({
    queryKey: ['user-xp-entries', targetUserId],
    queryFn: () => userXpService.getByUser(targetUserId).then(r => r.data),
    enabled: !isOwnProfile && !!targetUserId,
  })

  const { data: kcOtherUser, isSuccess: kcOtherLoaded } = useQuery({
    queryKey: ['keycloak-user', targetUserId],
    queryFn: () => getKeycloakUser(targetUserId),
    enabled: !isOwnProfile && !!targetUserId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const isDeletedUser = !isOwnProfile && kcOtherLoaded && kcOtherUser === null

  const otherName = !isOwnProfile
    ? kcOtherUser?.user
      ? `${kcOtherUser.user.firstName ?? ''} ${kcOtherUser.user.lastName ?? ''}`.trim() || null
      : otherUserEntries?.[0]
        ? `${otherUserEntries[0].firstName} ${otherUserEntries[0].lastName}`.trim()
        : null
    : null

  const displayName = isOwnProfile
    ? `${ownName ?? ''} ${ownLastName ?? ''}`.trim()
    : isDeletedUser
      ? 'DELETED USER'
      : (otherName ?? 'User')
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const chartData = buildChartData(history)
  const completedTasks = history.filter(e => e.taskId && e.taskId !== '00000000-0000-0000-0000-000000000000')

  const { data: submissionsData } = useQuery({
    queryKey: ['my-submissions', targetUserId],
    queryFn: () => workSubmissionService.getAll({ pageSize: 100 }).then(r => r.data),
    enabled: isOwnProfile && tab === 'submissions',
  })
  const allSubmissions = submissionsData?.items ?? []
  const mySubmissions = allSubmissions.filter(s => s.userId?.toString() === targetUserId?.toString())

  const { data: reviewsData } = useQuery({
    queryKey: ['my-reviews', targetUserId],
    queryFn: () => reviewService.getAll({ pageSize: 200 }).then(r => r.data),
    enabled: isOwnProfile && tab === 'reviews',
  })
  const myReviews = (reviewsData?.items ?? []).filter(r => {
    const rId = (r.user?.userId ?? r.userId)?.toString().toLowerCase()
    return rId && rId === targetUserId?.toString().toLowerCase()
  })

  const { data: allTasksData } = useQuery({
    queryKey: ['all-tasks-author'],
    queryFn: () => taskService.getAll({ pageSize: 500 }).then(r => r.data),
  })
  const healthMap = useTaskHealthMap()
  const authoredTasks = (allTasksData?.items ?? []).filter(
    t => t.authorId && t.authorId !== EMPTY_GUID && t.authorId === targetUserId
  )
  const authoredHealthCounts = { Good: 0, Neutral: 0, Poor: 0 }
  authoredTasks.forEach(t => {
    const h = healthMap[t.id]?.health ?? 'Neutral'
    authoredHealthCounts[h]++
  })
  const authorHealth = authoredTasks.length === 0
    ? null
    : authoredHealthCounts.Good > authoredHealthCounts.Poor ? 'Good'
      : authoredHealthCounts.Poor > authoredHealthCounts.Good ? 'Poor'
      : 'Neutral'

  useEffect(() => {
    if (!targetUserId) return
    const { bio: storedBio, avatar: storedAvatar } = loadProfile(targetUserId)
    setBio(storedBio)
    setBioInput(storedBio)
    setAvatar(storedAvatar)
  }, [targetUserId])

  const saveBio = () => {
    saveProfile(currentUserId, { bio: bioInput })
    setBio(bioInput)
    setEditingBio(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    if (!dataUrl) return
    setAvatar(dataUrl)
    saveProfile(currentUserId, { avatar: dataUrl })
  }

  const tabs = isOwnProfile
    ? [{ key: 'tasks', label: `Tasks (${completedTasks.length})` }, { key: 'submissions', label: 'Submissions' }, { key: 'reviews', label: 'Reviews' }]
    : [{ key: 'tasks', label: `Tasks (${completedTasks.length})` }]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {isDeletedUser && (
          <div className="mb-6 px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-sm text-red-400">
            This account has been deleted.
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left column */}
          <div className="lg:w-72 shrink-0 space-y-4">

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col items-center text-center mb-5">
                <label className={`relative mb-4 ${isOwnProfile ? 'cursor-pointer group' : ''}`}>
                  <LetterAvatar name={displayName} src={avatar} size="lg" />
                  {isOwnProfile && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white">
                        Change
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </>
                  )}
                </label>
                <h2 className="text-lg font-semibold text-white">{displayName || 'User'}</h2>
                {isOwnProfile && email && <p className="text-xs text-slate-400 mt-0.5">{email}</p>}
                <span className="mt-2 inline-block text-xs capitalize bg-slate-800 text-violet-400 border border-violet-500/20 rounded-full px-3 py-0.5">
                  {isOwnProfile ? role : 'member'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-violet-400">{totalXp}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Total XP</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{level}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Level</p>
                </div>
              </div>

              <XpBar totalXp={totalXp} />
            </div>

            {/* Author health */}
            {authorHealth && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Author Rating</p>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${HEALTH_COLOR[authorHealth]}`}>
                    {HEALTH_LABEL[authorHealth]}
                  </span>
                  <span className="text-xs text-slate-500">{authoredTasks.length} task{authoredTasks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-400">{authoredHealthCounts.Good} good</span>
                  <span className="text-yellow-400">{authoredHealthCounts.Neutral} neutral</span>
                  <span className="text-red-400">{authoredHealthCounts.Poor} poor</span>
                </div>
              </div>
            )}

            {/* Bio */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bio</p>
                {isOwnProfile && !editingBio && (
                  <button onClick={() => setEditingBio(true)} className="text-xs text-slate-500 hover:text-violet-400 transition-colors">
                    Edit
                  </button>
                )}
              </div>
              {editingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    rows={4}
                    placeholder="Tell something about yourself..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveBio}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setBioInput(bio); setEditingBio(false) }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {bio || <span className="text-slate-600 italic">{isOwnProfile ? 'No bio yet. Click Edit to add one.' : 'No bio.'}</span>}
                </p>
              )}
            </div>

            {/* XP chart */}
            {chartData.length > 1 && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">XP Progress</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#a78bfa' }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#7c3aed" strokeWidth={2} fill="url(#xpGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-5">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    tab === t.key ? 'bg-violet-600 text-white' : 'text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'tasks' && (
              completedTasks.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 text-center">
                  <p className="text-slate-500 text-sm">No completed tasks yet.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                  {completedTasks.map((entry, i) => {
                    const taskHealthInfo = healthMap[entry.taskId]
                    const taskHealth = taskHealthInfo?.health ?? 'Neutral'
                    return (
                      <div
                        key={entry.id}
                        onClick={() => navigate(`/tasks/${entry.taskId}`)}
                        className={`flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-800/50 transition-colors ${i < completedTasks.length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-300 truncate">{entry.taskName ?? 'Task completed'}</p>
                            <span className={`text-xs shrink-0 ${HEALTH_COLOR[taskHealth]}`}>{HEALTH_LABEL[taskHealth]}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(entry.earnedAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400 shrink-0 ml-3">+{entry.xpAmount} XP</span>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {tab === 'submissions' && isOwnProfile && (
              mySubmissions.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 text-center">
                  <p className="text-slate-500 text-sm">No submissions yet.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                  {mySubmissions.map((sub, i) => (
                    <div
                      key={sub.id}
                      onClick={() => navigate(`/submissions/${sub.id}`)}
                      className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-800/50 transition-colors ${i < mySubmissions.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">{sub.taskName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(sub.submissionDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs shrink-0 ${STATUS_COLORS[sub.statusName] ?? 'text-slate-400'}`}>
                        {sub.statusName}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'reviews' && isOwnProfile && (
              myReviews.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 text-center">
                  <p className="text-slate-500 text-sm">No reviews written yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.map(r => (
                    <div
                      key={r.id}
                      onClick={() => navigate(`/tasks/${r.taskId}`)}
                      className="bg-slate-900 border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        <span className="text-xs text-slate-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
