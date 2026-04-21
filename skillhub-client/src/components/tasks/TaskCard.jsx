const difficultyConfig = {
  1: { label: 'Junior', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  2: { label: 'Middle', color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/20'  },
  3: { label: 'Senior', color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20'        },
}
export default function TaskCard({ task, onClick }) {
  const diff = difficultyConfig[task.difficulty] ?? difficultyConfig[0]

  return (
    <div
      onClick={onClick}
      className="relative bg-slate-900 border border-white/5 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-black/30"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-white font-semibold text-base leading-snug">{task.title}</h2>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${diff.bg} ${diff.color}`}>
          {diff.label}
        </span>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
        {task.description || 'No description provided.'}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>⏱ {task.estimatedTimeMinutes} min</span>
        <span>⚡ {task.xpReward} XP</span>
        <span className={`ml-auto font-medium ${task.isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
          {task.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}