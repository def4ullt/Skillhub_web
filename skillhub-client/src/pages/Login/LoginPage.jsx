import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import keycloak, { getRole } from '../../auth/keycloak'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) return setError('Fill in all fields')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        'http://localhost:8080/realms/skillhub/protocol/openid-connect/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'password',
            client_id: 'skillhub-client',
            username,
            password,
          }),
        }
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const desc = errData.error_description ?? ''
        if (desc.toLowerCase().includes('disabled') || desc.toLowerCase().includes('blocked')) {
          setError('Your account has been blocked. Contact an administrator.')
        } else {
          setError('Invalid username or password')
        }
        return
      }

      const data = await res.json()
      keycloak.token = data.access_token
      keycloak.refreshToken = data.refresh_token
      keycloak.tokenParsed = JSON.parse(atob(data.access_token.split('.')[1]))
      keycloak.subject = keycloak.tokenParsed.sub
      keycloak.authenticated = true
      localStorage.setItem('kc_token', data.access_token)
      localStorage.setItem('kc_refresh_token', data.refresh_token)
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
        <p className="text-slate-500 text-sm mb-8">Sign in to continue</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
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
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="flex justify-between text-xs text-slate-500">
            <button
              onClick={() => navigate('/register')}
              className="hover:text-slate-300 transition-colors"
            >
              Don't have an account? Register
            </button>
            <Link to="/forgot-password" className="hover:text-violet-400 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}