import { useParams, useNavigate } from 'react-router-dom'
import { useTaskDetail } from '../../hooks/useTaskDetail'
import SubmitTaskForm from '../../components/tasks/SubmitTaskForm'

const difficultyLabel = { 1: 'Junior', 2: 'Middle', 3: 'Senior' }
const difficultyColor = { 1: 'text-emerald-400', 2: 'text-yellow-400', 3: 'text-red-400' }

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: task, isLoading, isError } = useTaskDetail(id)

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      Loading...
    </div>
  )

  if (isError) return (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-2">
    <p className="text-9xl font-semibold text-white">404</p>
    <p className="text-lg font-medium text-white">Task not found</p>
    <p className="text-sm text-slate-500">The task you're looking for doesn't exist</p>
    <button
      onClick={() => navigate('/')}
      className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
    >
      ← Back to tasks
    </button>
  </div>
)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back
        </button>

        <div className="mb-8">
          <span className={`text-xs ${difficultyColor[task.difficulty] ?? 'text-slate-400'} mb-3 block`}>
            {difficultyLabel[task.difficulty] ?? '—'}
          </span>
          <h1 className="text-2xl font-semibold text-white mb-4">{task.title}</h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">{task.description}</p>

          <div className="flex gap-3">
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Time</p>
              <p className="text-sm text-white">{task.estimatedTimeMinutes} min</p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">XP</p>
              <p className="text-sm text-white">{task.xpReward}</p>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className={`text-sm ${task.isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                {task.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {task.tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => navigate(`/?tagIds=${tag.id}`)}
                  className="text-xs text-slate-400 border border-white/10 rounded-lg px-2.5 py-1 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {task.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {task.technologies.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => navigate(`/?technologyIds=${tech.id}`)}
                  className="text-xs text-violet-400 border border-violet-500/20 rounded-lg px-2.5 py-1 hover:border-violet-500/50 transition-colors"
                >
                  {tech.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <SubmitTaskForm task={task} />

      </div>
    </div>
  )
}