import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTasks, useFilters } from '../../hooks/useTasks'
import { useSubmissions } from '../../hooks/useSubmissions'
import { getUserId } from '../../auth/keycloak'
import TaskCard from '../../components/tasks/TaskCard'

const DIFFICULTIES = [
  { label: 'All',    value: undefined },
  { label: 'Junior', value: 1 },
  { label: 'Middle', value: 2 },
  { label: 'Senior', value: 3 },
]

export default function TasksPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [params, setParams] = useState(() => {
    const initial = { page: 1, pageSize: 10 }
    const tagIds = searchParams.getAll('tagIds')
    const technologyIds = searchParams.getAll('technologyIds')
    if (tagIds.length) initial.tagIds = tagIds
    if (technologyIds.length) initial.technologyIds = technologyIds
    return initial
  })
  const [onlyMine, setOnlyMine] = useState(false)

  useEffect(() => {
    if (!searchParams.has('tagIds') && !searchParams.has('technologyIds')) {
      setParams({ page: 1, pageSize: 10 })
    }
  }, [searchParams])

  const currentUserId = getUserId()
  const { data, isLoading } = useTasks(params)
  const { data: filters } = useFilters()

  const { data: mySubmissions } = useSubmissions(
    onlyMine && currentUserId ? { userId: currentUserId, pageSize: 200 } : null
  )

  const myTaskIds = onlyMine
    ? new Set((mySubmissions?.items ?? []).map(s => s.taskId))
    : null

  const displayedTasks = myTaskIds
    ? (data?.items ?? []).filter(t => myTaskIds.has(t.id))
    : (data?.items ?? [])

  const set = (key, value) => setParams(p => ({ ...p, [key]: value, page: 1 }))

  const setDifficulty = (value) => {
    setParams(p => {
      const next = { ...p, page: 1 }
      if (value === undefined) delete next.difficulty
      else next.difficulty = value
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Tasks</h1>
          <p className="text-slate-400 text-sm">{data?.totalCount ?? 0} tasks found</p>
        </div>

        <div className="flex gap-8">

          <aside className="w-60 shrink-0 space-y-6">

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">View</label>
              <button
                onClick={() => setOnlyMine(v => !v)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  onlyMine ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                ✓ My tasks
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Search</label>
              <input
                type="text"
                placeholder="Task title..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Difficulty</label>
              <div className="space-y-1">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.label}
                    onClick={() => setDifficulty(d.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      params.difficulty === d.value
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {filters?.tags?.length > 0 && (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map(tag => {
                    const active = params.tagIds?.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const current = params.tagIds ?? []
                          set('tagIds', active ? current.filter(id => id !== tag.id) : [...current, tag.id])
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          active
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-white/10 text-slate-400 hover:border-violet-500/50'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {filters?.technologies?.length > 0 && (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Technologies</label>
                <div className="flex flex-wrap gap-2">
                  {filters.technologies.map(tech => {
                    const active = params.technologyIds?.includes(tech.id)
                    return (
                      <button
                        key={tech.id}
                        onClick={() => {
                          const current = params.technologyIds ?? []
                          set('technologyIds', active ? current.filter(id => id !== tech.id) : [...current, tech.id])
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          active
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-white/10 text-slate-400 hover:border-violet-500/50'
                        }`}
                      >
                        {tech.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="text-slate-500 text-sm">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {displayedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    />
                  ))}
                  {onlyMine && displayedTasks.length === 0 && (
                    <p className="text-slate-500 text-sm">You haven't submitted any tasks yet.</p>
                  )}
                </div>

                {!onlyMine && (
                  <div className="flex items-center justify-between mt-8 text-sm text-slate-400">
                    <button
                      disabled={params.page <= 1}
                      onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
                      className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Prev
                    </button>
                    <span>Page {params.page} of {data?.totalPages ?? 1}</span>
                    <button
                      disabled={params.page >= (data?.totalPages ?? 1)}
                      onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
                      className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
