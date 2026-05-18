import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { taskService } from '../../services/taskService'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const [input, setInput] = useState(q)

  useEffect(() => { setInput(q) }, [q])

  const { data, isLoading } = useQuery({
    queryKey: ['task-search', q],
    queryFn: () => taskService.getAll({ title: q, pageSize: 30 }).then(r => r.data),
    enabled: q.length > 0,
  })

  const tasks = data?.items ?? (Array.isArray(data) ? data : [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed) setSearchParams({ q: trimmed })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        <form onSubmit={handleSubmit} className="mb-8">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search tasks by name..."
            autoFocus
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-3 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </form>

        {!q ? (
          <p className="text-slate-500 text-center mt-20">Type something and press Enter to search</p>
        ) : isLoading ? (
          <p className="text-slate-500 text-sm">Searching...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-500 text-center mt-20">No tasks found for "{q}"</p>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found for "{q}"</p>
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="bg-slate-900 border border-white/5 rounded-xl p-5 cursor-pointer hover:border-violet-500/40 hover:shadow-lg hover:shadow-black/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{task.title}</p>
                      {task.description && (
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-violet-400 text-sm font-medium">{task.xpReward ?? task.xpreward ?? 0} XP</span>
                      {task.difficulty && (
                        <p className="text-slate-500 text-xs mt-0.5">{task.difficulty}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
