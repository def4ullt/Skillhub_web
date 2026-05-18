import { Link, useLocation, useNavigate } from 'react-router-dom'
import keycloak, { getRole } from '../../auth/keycloak'

export default function Navbar({ role }) {
  console.log('navbar role:', role)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const name = keycloak.tokenParsed?.given_name ?? keycloak.tokenParsed?.preferred_username ?? 'User'
  

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg tracking-tight">
          Skill<span className="text-violet-400">Hub</span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/', { replace: true })}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === '/' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tasks
          </button>
          <Link
            to="/submissions"
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === '/submissions' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Submissions
          </Link>
          {(role === 'mentor' || role === 'admin') && (
            <Link
              to="/tasks/create"
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === '/tasks/create' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Create Task
            </Link>
          )}
          {role === 'admin' && (
            <Link
              to="/admin"
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith('/admin') ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-white">{name}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
          <button
            onClick={() => {localStorage.removeItem('kc_token')
                            localStorage.removeItem('kc_refresh_token')
                            keycloak.logout({ redirectUri: 'http://localhost:5173' })}}
            className="text-sm px-4 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-red-500/50 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}