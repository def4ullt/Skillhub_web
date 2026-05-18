const difficultyColor = {
  1: 'text-emerald-400',
  2: 'text-yellow-400',
  3: 'text-red-400',
}

const difficultyLabel = {
  1: 'Junior',
  2: 'Middle',
  3: 'Senior',
}

export default function TaskCard({ task, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-white/5 rounded-xl px-5 py-4 cursor-pointer transition-colors hover:bg-slate-800/60"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-white font-medium text-sm">{task.title}</h2>
        <span className={`text-xs ${difficultyColor[task.difficulty] ?? 'text-slate-400'}`}>
          {difficultyLabel[task.difficulty] ?? '—'}
        </span>
      </div>

      <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">
        {task.description || 'No description.'}
      </p>

      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span>{task.estimatedTimeMinutes} min</span>
        <span>·</span>
        <span>{task.xpReward} XP</span>
        <span className={`ml-auto ${task.isActive ? 'text-emerald-500' : 'text-slate-700'}`}>
          {task.isActive ? 'active' : 'inactive'}
        </span>
      </div>
    </div>
  )
}