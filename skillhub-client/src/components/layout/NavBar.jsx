import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Tasks' },
  { to: '/submissions', label: 'Submissions' },
  { to: '/tasks/create', label: 'Create Task' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg tracking-tight">
          Skill<span className="text-violet-400">Hub</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === link.to
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          to="/login"
          className="text-sm px-4 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-violet-500/50 hover:text-white transition-colors"
        >
          Login
        </Link>
      </div>
    </nav>
  )
}