import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import keycloak, { getRole } from '../../auth/keycloak'

export default function RegisterPage({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleRegister = async () => {
    if (!form.username || !form.password || !form.firstName || !form.lastName || !form.email)
      return setError('Fill in all fields')
    setLoading(true)
    setError(null)

    try {
      const tokenRes = await fetch(
        '/keycloak-admin/realms/master/protocol/openid-connect/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: 'admin',
            password: 'admin',
          }),
        }
      )

      if (!tokenRes.ok) { setError('Registration failed'); return }

      const tokenData = await tokenRes.json()

      const registerRes = await fetch(
        '/keycloak-admin/admin/realms/skillhub/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify({
            username: form.username,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            emailVerified: true,
            enabled: true,
            credentials: [{ type: 'password', value: form.password, temporary: false }],
          }),
        }
      )

      if (!registerRes.ok) { setError('Username or email already exists'); return }

      const usersRes = await fetch(
        `/keycloak-admin/admin/realms/skillhub/users?username=${form.username}`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      )
      const users = await usersRes.json()
      const userId = users[0]?.id

      const rolesRes = await fetch(
        '/keycloak-admin/admin/realms/skillhub/roles/student',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      )
      const role = await rolesRes.json()

      await fetch(
        `/keycloak-admin/admin/realms/skillhub/users/${userId}/role-mappings/realm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify([role]),
        }
      )

      // Автологін
      const loginRes = await fetch(
        '/keycloak-admin/realms/skillhub/protocol/openid-connect/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'password',
            client_id: 'skillhub-client',
            username: form.username,
            password: form.password,
          }),
        }
      )

      if (!loginRes.ok) { navigate('/login'); return }

      const loginData = await loginRes.json()
      keycloak.token = loginData.access_token
      keycloak.refreshToken = loginData.refresh_token
      keycloak.tokenParsed = JSON.parse(atob(loginData.access_token.split('.')[1]))
      keycloak.subject = keycloak.tokenParsed.sub
      keycloak.authenticated = true
      localStorage.setItem('kc_token', loginData.access_token)
      localStorage.setItem('kc_refresh_token', loginData.refresh_token)
      onLogin(getRole())

    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">
          Skill<span className="text-violet-400">Hub</span>
        </h1>
        <p className="text-slate-500 text-sm mb-8">Create an account</p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1.5 block">First name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1.5 block">Last name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  )
}