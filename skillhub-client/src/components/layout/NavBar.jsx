import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import keycloak, { getRole } from '../../auth/keycloak'

export default function Navbar({ role }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const name = keycloak.tokenParsed?.given_name ?? keycloak.tokenParsed?.preferred_username ?? 'User'
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      setSearchQuery('')
    }
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        pathname === to || (to !== '/' && pathname.startsWith(to))
          ? 'bg-violet-600 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  )

  const dropdownLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </Link>
  )

  const logout = () => {
    localStorage.removeItem('kc_token')
    localStorage.removeItem('kc_refresh_token')
    keycloak.logout({ redirectUri: 'http://localhost:5173' })
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

        <Link to="/" className="text-white font-bold text-lg tracking-tight shrink-0">
          Skill<span className="text-violet-400">Hub</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink('/', 'Home')}
          {navLink('/tasks', 'Tasks')}
          {navLink('/submissions', 'Submissions')}
          {navLink('/leaderboard', 'Leaderboard')}
          {role === 'admin' && navLink('/admin', 'Admin')}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <form onSubmit={handleSearch}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 w-44 transition-colors"
            />
          </form>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm text-white leading-tight">{name}</p>
                <p className="text-xs text-slate-500 leading-tight capitalize">{role}</p>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                {dropdownLink('/profile', 'Profile')}
                {(role === 'mentor' || role === 'admin') && dropdownLink('/tasks/create', 'Create Task')}
                <button
                  disabled
                  className="flex items-center w-full px-4 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                >
                  Settings
                  <span className="ml-auto text-xs text-slate-700">Soon</span>
                </button>
                <div className="border-t border-white/5 my-1" />
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  )
}
