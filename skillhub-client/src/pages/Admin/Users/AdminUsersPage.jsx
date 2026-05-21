import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAllUsers } from '../../../hooks/useUserXp'
import { getKeycloakUsers } from '../../../utils/keycloak'
import AdminUserEditModal from './AdminUserEditModal'

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useAllUsers({ pageNumber: page, pageSize: 15 })

  const { data: kcUsers = [] } = useQuery({
    queryKey: ['kc-users'],
    queryFn: getKeycloakUsers,
    staleTime: 2 * 60 * 1000,
  })
  const kcMap = {}
  kcUsers.forEach(u => { kcMap[u.id] = u })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['all-users'] })
    qc.invalidateQueries({ queryKey: ['leaderboard'] })
    qc.invalidateQueries({ queryKey: ['kc-users'] })
    qc.invalidateQueries({ queryKey: ['user-xp-total'] })
    qc.invalidateQueries({ queryKey: ['user-xp'] })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : !data?.items?.length ? (
        <p className="text-slate-500 text-sm">No users yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map(user => {
              const kc = kcMap[user.userId]
              const isBlocked = kc?.enabled === false
              return (
                <div key={user.userId} className="bg-slate-900 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 text-sm w-8 shrink-0">#{user.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                        {isBlocked && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">Blocked</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{user.totalXp} XP{kc?.email ? ` · ${kc.email}` : ''}</p>
                    </div>
                    <button
                      onClick={() => setEditTarget({ user, kcUser: kc ?? null })}
                      className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-white transition-colors shrink-0"
                    >
                      Edit
                    </button>
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

      {editTarget && (
        <AdminUserEditModal
          user={editTarget.user}
          kcUser={editTarget.kcUser}
          onClose={() => setEditTarget(null)}
          onSaved={() => { invalidate(); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
