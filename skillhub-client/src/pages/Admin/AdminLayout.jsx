import { Link, useLocation } from 'react-router-dom'

const sections = [
  { to: '/admin/tasks', label: 'Tasks' },
  { to: '/admin/tags', label: 'Tags' },
  { to: '/admin/technologies', label: 'Technologies' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/statuses', label: 'Statuses' },
  { to: '/admin/delivery-methods', label: 'Delivery Methods' },
]

export default function AdminLayout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-52 shrink-0 border-r border-white/5 px-4 py-8 space-y-1">
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-4 px-3">Admin</p>
        {sections.map(s => (
          <Link
            key={s.to}
            to={s.to}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === s.to
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </aside>

      <main className="flex-1 px-8 py-8">
        {children}
      </main>
    </div>
  )
}