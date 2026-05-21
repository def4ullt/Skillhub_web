import { useState } from 'react'
import { Link } from 'react-router-dom'
import { findKeycloakUser, resetKeycloakPassword } from '../../utils/keycloak'

export default function ForgotPasswordPage() {
  const [identifier,      setIdentifier]      = useState('')
  const [userId,          setUserId]          = useState(null)
  const [userName,        setUserName]        = useState('')
  const [step,            setStep]            = useState('email')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')

  const handleFindUser = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) { setError('Enter your username or email.'); return }
    setLoading(true); setError('')
    try {
      const user = await findKeycloakUser(identifier.trim())
      if (!user) { setError('No account found. Check your username or email.'); return }
      if (user.enabled === false) { setError('This account is blocked. Contact an administrator.'); return }
      setUserId(user.id)
      setUserName(
        user.firstName
          ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
          : user.username ?? identifier
      )
      setStep('password')
    } catch {
      setError('Failed to look up account. Please try again.')
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const ok = await resetKeycloakPassword(userId, password)
      if (ok) setStep('done')
      else setError('Failed to reset password. Please try again.')
    } catch {
      setError('Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Skill<span className="text-violet-400">Hub</span>
          </h1>
          <p className="text-slate-500 text-sm">Reset your password</p>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

          {step === 'email' && (
            <form onSubmit={handleFindUser} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Username or email</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError('') }}
                  placeholder="johndoe or you@example.com"
                  autoFocus
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {loading ? 'Looking up...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-300">
                Setting new password for <span className="text-white font-medium">{userName}</span>
              </p>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Min 6 characters"
                  autoFocus
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Repeat password"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {loading ? 'Resetting...' : 'Set New Password'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setError('') }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <span className="text-emerald-400 text-xl">✓</span>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Password reset!</p>
                <p className="text-slate-400 text-sm">You can now sign in with your new password.</p>
              </div>
              <Link
                to="/"
                className="block w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/" className="text-violet-400 hover:text-violet-300 transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
