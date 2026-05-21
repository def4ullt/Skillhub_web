import { useState } from 'react'
import { updateKeycloakUser, resetKeycloakPassword, setKeycloakUserEnabled, deleteKeycloakUser } from '../../../utils/keycloak'
import { workSubmissionService, userXpService } from '../../../services/workService'

function Section({ title, children }) {
  return (
    <div className="border-t border-white/5 pt-5 first:border-0 first:pt-0">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">{title}</p>
      {children}
    </div>
  )
}

function Msg({ msg }) {
  if (!msg) return null
  return <p className={`text-xs mt-2 ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
}

export default function AdminUserEditModal({ user, kcUser, onClose, onSaved }) {
  const [firstName, setFirstName] = useState(kcUser?.firstName ?? user.firstName ?? '')
  const [lastName, setLastName]   = useState(kcUser?.lastName  ?? user.lastName  ?? '')
  const [nameMsg,  setNameMsg]    = useState(null)
  const [nameSaving, setNameSaving] = useState(false)

  const [password,     setPassword]     = useState('')
  const [passMsg,      setPassMsg]      = useState(null)
  const [passSaving,   setPassSaving]   = useState(false)

  const [xpAmount, setXpAmount] = useState('')
  const [xpMsg,    setXpMsg]    = useState(null)
  const [xpSaving, setXpSaving] = useState(false)

  const [blockMsg,    setBlockMsg]    = useState(null)
  const [blockSaving, setBlockSaving] = useState(false)

  const [deleteConfirm,   setDeleteConfirm]   = useState('')
  const [deleteMsg,       setDeleteMsg]       = useState(null)
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [showDeleteChoice, setShowDeleteChoice] = useState(false)

  const isBlocked = kcUser?.enabled === false

  const saveName = async () => {
    setNameSaving(true); setNameMsg(null)
    try {
      const ok = await updateKeycloakUser(user.userId, { firstName: firstName.trim(), lastName: lastName.trim() })
      if (ok) {
        await userXpService.rename(user.userId, { firstName: firstName.trim(), lastName: lastName.trim() })
        setNameMsg({ ok: true, text: 'Name updated.' })
        onSaved?.()
      } else {
        setNameMsg({ ok: false, text: 'Failed to update name.' })
      }
    } catch {
      setNameMsg({ ok: false, text: 'Error updating name.' })
    } finally { setNameSaving(false) }
  }

  const savePassword = async () => {
    if (password.length < 6) { setPassMsg({ ok: false, text: 'Min 6 characters.' }); return }
    setPassSaving(true); setPassMsg(null)
    try {
      const ok = await resetKeycloakPassword(user.userId, password)
      if (ok) { setPassMsg({ ok: true, text: 'Password reset successfully.' }); setPassword('') }
      else setPassMsg({ ok: false, text: 'Failed to reset password.' })
    } catch {
      setPassMsg({ ok: false, text: 'Error resetting password.' })
    } finally { setPassSaving(false) }
  }

  const adjustXp = async () => {
    const amount = parseInt(xpAmount, 10)
    if (isNaN(amount) || amount === 0) { setXpMsg({ ok: false, text: 'Enter a non-zero number.' }); return }
    setXpSaving(true); setXpMsg(null)
    try {
      await userXpService.adjust({ userId: user.userId, xpAmount: amount })
      setXpMsg({ ok: true, text: `${amount > 0 ? '+' : ''}${amount} XP applied.` })
      setXpAmount('')
      onSaved?.()
    } catch {
      setXpMsg({ ok: false, text: 'Failed to adjust XP.' })
    } finally { setXpSaving(false) }
  }

  const toggleBlock = async () => {
    setBlockSaving(true); setBlockMsg(null)
    try {
      const ok = await setKeycloakUserEnabled(user.userId, isBlocked)
      if (ok) {
        setBlockMsg({ ok: true, text: isBlocked ? 'User unblocked.' : 'User blocked. All sessions revoked.' })
        onSaved?.()
      } else {
        setBlockMsg({ ok: false, text: 'Failed.' })
      }
    } catch {
      setBlockMsg({ ok: false, text: 'Error.' })
    } finally { setBlockSaving(false) }
  }

  const handleDeleteClick = () => {
    if (deleteConfirm !== 'DELETE') { setDeleteMsg({ ok: false, text: 'Type DELETE to confirm.' }); return }
    setShowDeleteChoice(true)
  }

  const performDelete = async (deleteDbData) => {
    setDeleteInProgress(true); setDeleteMsg(null)
    try {
      if (deleteDbData) {
        try {
          const res = await workSubmissionService.getAll({ pageSize: 500 })
          const items = res.data?.items ?? []
          const mine = items.filter(s => s.userId?.toString() === user.userId?.toString())
          await Promise.allSettled(mine.map(s => workSubmissionService.delete(s.id)))
        } catch { /* ignore */ }
      }
      const ok = await deleteKeycloakUser(user.userId)
      if (ok) { onSaved?.(); onClose?.() }
      else setDeleteMsg({ ok: false, text: 'Failed to delete account.' })
    } catch {
      setDeleteMsg({ ok: false, text: 'Error deleting account.' })
    } finally { setDeleteInProgress(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
          <div>
            <p className="text-white font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-500">
              {user.totalXp} XP · Rank #{user.rank}
              {kcUser?.email && <span className="ml-2">· {kcUser.email}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isBlocked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">Blocked</span>
            )}
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none transition-colors">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          <Section title="Name">
            <div className="flex gap-2 mb-3">
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <Msg msg={nameMsg} />
            <button
              onClick={saveName}
              disabled={nameSaving}
              className="mt-3 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm transition-colors"
            >
              {nameSaving ? 'Saving...' : 'Save Name'}
            </button>
          </Section>

          <Section title="XP Adjustment">
            <div className="flex gap-2">
              <input
                type="number"
                value={xpAmount}
                onChange={e => setXpAmount(e.target.value)}
                placeholder="±amount (negative to deduct)"
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={adjustXp}
                disabled={xpSaving}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm transition-colors"
              >
                {xpSaving ? '...' : 'Apply'}
              </button>
            </div>
            <Msg msg={xpMsg} />
          </Section>

          <Section title="Reset Password">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
            <Msg msg={passMsg} />
            <button
              onClick={savePassword}
              disabled={passSaving}
              className="mt-3 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm transition-colors"
            >
              {passSaving ? 'Resetting...' : 'Reset Password'}
            </button>
          </Section>

          <Section title="Account Access">
            <p className="text-xs text-slate-400 mb-3">
              {isBlocked
                ? 'User is currently blocked — they cannot log in and all sessions are revoked.'
                : 'User account is active.'}
            </p>
            <Msg msg={blockMsg} />
            <button
              onClick={toggleBlock}
              disabled={blockSaving}
              className={`mt-3 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 ${
                isBlocked
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-orange-700/80 hover:bg-orange-600 text-white'
              }`}
            >
              {blockSaving ? '...' : isBlocked ? 'Unblock User' : 'Block User'}
            </button>
          </Section>

          <Section title="Danger Zone">
            <p className="text-xs text-slate-400 mb-3">
              Type <span className="font-mono text-red-400">DELETE</span> to permanently delete this account.
            </p>
            <input
              className="w-full bg-slate-950 border border-red-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              value={deleteConfirm}
              onChange={e => { setDeleteConfirm(e.target.value); setShowDeleteChoice(false) }}
              placeholder="Type DELETE"
            />
            <Msg msg={deleteMsg} />
            {showDeleteChoice ? (
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => performDelete(false)}
                  disabled={deleteInProgress}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  {deleteInProgress ? '...' : 'Keep DB data'}
                </button>
                <button
                  onClick={() => performDelete(true)}
                  disabled={deleteInProgress}
                  className="px-3 py-2 rounded-xl text-xs bg-red-800 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
                >
                  {deleteInProgress ? '...' : 'Delete all data'}
                </button>
                <button onClick={() => setShowDeleteChoice(false)} disabled={deleteInProgress}
                  className="px-3 py-2 rounded-xl text-xs bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                disabled={deleteConfirm !== 'DELETE' || deleteInProgress}
                className="mt-3 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition-colors"
              >
                Delete Account
              </button>
            )}
          </Section>

        </div>
      </div>
    </div>
  )
}
