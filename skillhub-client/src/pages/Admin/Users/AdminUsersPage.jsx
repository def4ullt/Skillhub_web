import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAllUsers, useAdjustXp, useRenameUser } from '../../../hooks/useUserXp'

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [adjusting, setAdjusting] = useState(null)
  const [renaming, setRenaming] = useState(null)
  const [amount, setAmount] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useAllUsers({ pageNumber: page, pageSize: 15 })
  const qc = useQueryClient()
  const adjust = useAdjustXp()
  const rename = useRenameUser()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['all-users'] })
    qc.invalidateQueries({ queryKey: ['leaderboard'] })
    qc.invalidateQueries({ queryKey: ['user-xp-total'] })
    qc.invalidateQueries({ queryKey: ['user-xp'] })
  }

  const openAdjust = (user) => { setAdjusting(user); setRenaming(null); setAmount(''); setError('') }
  const openRename = (user) => { setRenaming(user); setAdjusting(null); setFirstName(user.firstName ?? ''); setLastName(user.lastName ?? ''); setError('') }
  const cancelAll = () => { setAdjusting(null); setRenaming(null); setAmount(''); setError('') }

  const handleAdjust = (e) => {
    e.preventDefault()
    const xpAmount = parseInt(amount, 10)
    if (isNaN(xpAmount) || xpAmount === 0) { setError('Enter a non-zero number (negative to deduct)'); return }
    adjust.mutate(
      { userId: adjusting.userId, xpAmount },
      { onSuccess: () => { invalidate(); cancelAll() }, onError: () => setError('Failed to adjust XP') }
    )
  }

  const handleRename = (e) => {
    e.preventDefault()
    if (!firstName.trim()) { setError('First name is required'); return }
    rename.mutate(
      { userId: renaming.userId, firstName: firstName.trim(), lastName: lastName.trim() },
      { onSuccess: () => { invalidate(); cancelAll() }, onError: () => setError('Failed to rename user') }
    )
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
            {data.items.map(user => (
              <div key={user.userId} className="bg-slate-900 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <span className="text-slate-600 text-sm w-8 shrink-0">#{user.rank}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-violet-400 text-sm">{user.totalXp} XP</p>
                  </div>

                  {adjusting?.userId === user.userId ? (
                    <form onSubmit={handleAdjust} className="flex items-center gap-2 shrink-0">
                      <div>
                        <input
                          type="number"
                          value={amount}
                          onChange={e => { setAmount(e.target.value); setError('') }}
                          placeholder="±XP"
                          autoFocus
                          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                      </div>
                      <button type="submit" disabled={adjust.isPending} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-500 disabled:opacity-50 transition-colors">Apply</button>
                      <button type="button" onClick={cancelAll} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                    </form>
                  ) : renaming?.userId === user.userId ? (
                    <form onSubmit={handleRename} className="flex items-center gap-2 shrink-0">
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <input
                            value={firstName}
                            onChange={e => { setFirstName(e.target.value); setError('') }}
                            placeholder="First name"
                            autoFocus
                            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:outline-none focus:border-violet-500/50 transition-colors"
                          />
                          <input
                            value={lastName}
                            onChange={e => { setLastName(e.target.value); setError('') }}
                            placeholder="Last name"
                            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:outline-none focus:border-violet-500/50 transition-colors"
                          />
                        </div>
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                      </div>
                      <button type="submit" disabled={rename.isPending} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors">Save</button>
                      <button type="button" onClick={cancelAll} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                    </form>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openAdjust(user)}
                        className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-white transition-colors"
                      >
                        Adjust XP
                      </button>
                      <button
                        onClick={() => openRename(user)}
                        className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 hover:border-emerald-500/40 hover:text-white transition-colors"
                      >
                        Edit Name
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
  )
}
