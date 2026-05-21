import { useState, useEffect } from 'react'
import keycloak, { getRole, getUserId } from '../../auth/keycloak'
import { userXpService, workSubmissionService } from '../../services/workService'
import { updateKeycloakUser, deleteKeycloakUser, resetKeycloakPassword } from '../../utils/keycloak'
import { compressImage, loadProfile, saveProfile } from '../../utils/userProfile'

function Section({ title, children }) {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="text-xs text-slate-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"

export default function SettingsPage() {
  const currentUserId = getUserId()
  const role = getRole()

  const [profile, setProfile] = useState({ firstName: '', lastName: '', bio: '' })
  const [avatar, setAvatar] = useState(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [password, setPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteMsg, setDeleteMsg] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showAdminChoice, setShowAdminChoice] = useState(false)

  useEffect(() => {
    if (!currentUserId) return
    const { bio, avatar: storedAvatar } = loadProfile(currentUserId)
    setProfile(p => ({
      ...p,
      firstName: keycloak.tokenParsed?.given_name ?? '',
      lastName: keycloak.tokenParsed?.family_name ?? '',
      bio,
    }))
    setAvatar(storedAvatar)
  }, [currentUserId])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarSaving(true)
    setProfileMsg(null)
    const dataUrl = await compressImage(file)
    if (!dataUrl) { setAvatarSaving(false); return }
    setAvatar(dataUrl)
    saveProfile(currentUserId, { avatar: dataUrl })
    setAvatarSaving(false)
  }

  const saveProfileData = async () => {
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      saveProfile(currentUserId, { bio: profile.bio })
      const ok = await updateKeycloakUser(currentUserId, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      })
      if (ok) {
        await userXpService.rename(currentUserId, { firstName: profile.firstName, lastName: profile.lastName })
      }
      setProfileMsg({ ok: true, text: 'Profile saved.' })
    } catch {
      saveProfile(currentUserId, { bio: profile.bio })
      setProfileMsg({ ok: false, text: 'Name update failed, but bio was saved locally.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async () => {
    if (!password.trim() || password.length < 6) {
      setPasswordMsg({ ok: false, text: 'Password must be at least 6 characters.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const ok = await resetKeycloakPassword(currentUserId, password)
      if (ok) {
        setPasswordMsg({ ok: true, text: 'Password changed successfully.' })
        setPassword('')
      } else {
        setPasswordMsg({ ok: false, text: 'Failed to change password.' })
      }
    } catch {
      setPasswordMsg({ ok: false, text: 'Something went wrong.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const performDelete = async (deleteDbData) => {
    setDeleting(true)
    setDeleteMsg(null)
    try {
      if (deleteDbData) {
        try {
          const res = await workSubmissionService.getAll({ pageSize: 500 })
          const items = res.data?.items ?? []
          const mine = items.filter(s => s.userId?.toString() === currentUserId?.toString())
          await Promise.allSettled(mine.map(s => workSubmissionService.delete(s.id)))
        } catch { /* ignore */ }
      }
      const ok = await deleteKeycloakUser(currentUserId)
      if (ok) {
        localStorage.removeItem('kc_token')
        localStorage.removeItem('kc_refresh_token')
        localStorage.removeItem(`profile_${currentUserId}`)
        keycloak.logout({ redirectUri: 'http://localhost:5173' })
      } else {
        setDeleteMsg({ ok: false, text: 'Failed to delete account.' })
        setDeleting(false)
      }
    } catch {
      setDeleteMsg({ ok: false, text: 'Something went wrong.' })
      setDeleting(false)
    }
  }

  const handleDeleteClick = () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteMsg({ ok: false, text: 'Type DELETE to confirm.' })
      return
    }
    if (role === 'admin') {
      setShowAdminChoice(true)
    } else {
      performDelete(false)
    }
  }

  const initials = (profile.firstName?.[0] ?? keycloak.tokenParsed?.given_name?.[0] ?? '?').toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <Section title="Profile">
          <div className="flex items-center gap-4 mb-5">
            <label className="relative cursor-pointer group shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center">
                {avatar
                  ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white text-xl font-bold">{initials}</span>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white">
                {avatarSaving ? '...' : 'Change'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarSaving} />
            </label>
            <p className="text-xs text-slate-500">
              {avatarSaving ? 'Saving avatar...' : 'Click avatar to change photo'}
            </p>
          </div>

          <div className="flex gap-3 mb-0">
            <Field label="First name">
              <input
                className={inputClass}
                value={profile.firstName}
                onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
              />
            </Field>
            <Field label="Last name">
              <input
                className={inputClass}
                value={profile.lastName}
                onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={profile.bio}
              placeholder="Tell something about yourself..."
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
            />
          </Field>
          {profileMsg && (
            <p className={`text-xs mb-3 ${profileMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{profileMsg.text}</p>
          )}
          <button
            onClick={saveProfileData}
            disabled={profileSaving}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </Section>

        <Section title="Change Password">
          <Field label="New password">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
            />
          </Field>
          {passwordMsg && (
            <p className={`text-xs mb-3 ${passwordMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{passwordMsg.text}</p>
          )}
          <button
            onClick={savePassword}
            disabled={passwordSaving}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </Section>

        <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">Danger Zone</h2>
          <p className="text-slate-400 text-sm mb-4">
            Deleting your account is permanent and cannot be undone.
            Type <span className="font-mono text-red-400">DELETE</span> to confirm.
          </p>
          <input
            className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors mb-3"
            value={deleteConfirm}
            onChange={e => { setDeleteConfirm(e.target.value); setShowAdminChoice(false) }}
            placeholder="Type DELETE to confirm"
          />
          {deleteMsg && (
            <p className={`text-xs mb-3 ${deleteMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{deleteMsg.text}</p>
          )}

          {showAdminChoice ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300 font-medium">What should happen to your data in the database?</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => performDelete(false)}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-sm transition-colors disabled:opacity-50"
                >
                  Keep data in DB
                </button>
                <button
                  onClick={() => performDelete(true)}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete account + all data'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDeleteClick}
              disabled={deleting || deleteConfirm !== 'DELETE'}
              className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete My Account'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
