import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { userXpService } from '../../services/workService'
import { loadProfile } from '../../utils/userProfile'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const [input, setInput] = useState(q)

  useEffect(() => { setInput(q) }, [q])

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['all-users-search'],
    queryFn: () => userXpService.getAllUsers({ pageNumber: 1, pageSize: 200 }).then(r => r.data),
  })

  const allUsers = usersData?.items ?? []
  const filteredUsers = q
    ? allUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q.toLowerCase()))
    : allUsers

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    setSearchParams(trimmed ? { q: trimmed } : {})
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-white mb-6">Search Users</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search by name..."
            autoFocus
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-3 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </form>

        {isLoading ? (
          <p className="text-slate-500 text-sm">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-slate-500 text-center mt-20">
            {q ? `No users found for "${q}"` : 'No users found.'}
          </p>
        ) : (
          <>
            {q && (
              <p className="text-slate-400 text-sm mb-4">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found for "{q}"
              </p>
            )}
            <div className="space-y-2">
              {filteredUsers.map(user => {
                const { avatar } = loadProfile(user.userId)
                const initials = (user.firstName?.[0] ?? '?').toUpperCase()
                return (
                  <div
                    key={user.userId}
                    onClick={() => navigate(`/profile/${user.userId}`)}
                    className="bg-slate-900 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-violet-500/40 hover:shadow-lg hover:shadow-black/20 transition-all flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-600 overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {avatar
                        ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                        : initials
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Level {Math.floor((user.totalXp ?? 0) / 500) + 1}</p>
                    </div>
                    <span className="text-sm font-semibold text-violet-400 shrink-0">{user.totalXp ?? 0} XP</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
