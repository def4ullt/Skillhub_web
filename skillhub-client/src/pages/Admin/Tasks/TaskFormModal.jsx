import { useState } from 'react'
import { taskService } from '../../../services/taskService'
import { getUserId } from '../../../auth/keycloak'

const DIFFICULTIES = [
  { label: 'Junior', value: 1 },
  { label: 'Middle', value: 2 },
  { label: 'Senior', value: 3 },
]

export default function TaskFormModal({ task, filters, onClose, onSaved }) {
  const isEdit = !!task.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    title: task.title ?? '',
    description: task.description ?? '',
    difficulty: task.difficulty ?? 1,
    estimatedTimeMinutes: task.estimatedTimeMinutes ?? 30,
    xpReward: task.xpReward ?? 100,
    isActive: task.isActive ?? true,
    technologyIds: task.technologyIds ?? [],
    tagIds: task.tagIds ?? [],
  })

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const toggleList = (key, id) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id]
    }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required')
    if (!form.tagIds.length) return setError('Select at least one tag')
    if (!form.technologyIds.length) return setError('Select at least one technology')
    setLoading(true)
    setError(null)
    try {
      if (isEdit) await taskService.update(task.id, form)
      else await taskService.create({ ...form, authorId: getUserId() })
      onSaved()
    } catch {
      setError('Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  onClick={() => set('difficulty', d.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    form.difficulty === d.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-900 border border-white/10 text-slate-400 hover:border-violet-500/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time & XP */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Time (min)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => set('estimatedTimeMinutes', Math.max(5, form.estimatedTimeMinutes - 5))}
                  className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors">−</button>
                <span className="text-sm text-white w-12 text-center">{form.estimatedTimeMinutes}</span>
                <button onClick={() => set('estimatedTimeMinutes', form.estimatedTimeMinutes + 5)}
                  className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors">+</button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">XP Reward</label>
              <div className="flex items-center gap-2">
                <button onClick={() => set('xpReward', Math.max(0, form.xpReward - 10))}
                  className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors">−</button>
                <span className="text-sm text-white w-12 text-center">{form.xpReward}</span>
                <button onClick={() => set('xpReward', form.xpReward + 10)}
                  className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors">+</button>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => set('isActive', !form.isActive)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-slate-300">Active</span>
          </div>

          {/* Tags */}
          {filters?.tags?.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {filters.tags.map(tag => (
                  <button key={tag.id} onClick={() => toggleList('tagIds', tag.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.tagIds.includes(tag.id)
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-white/10 text-slate-400 hover:border-violet-500/50'
                    }`}
                  >{tag.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Technologies */}
          {filters?.technologies?.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Technologies</label>
              <div className="flex flex-wrap gap-2">
                {filters.technologies.map(tech => (
                  <button key={tech.id} onClick={() => toggleList('technologyIds', tech.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.technologyIds.includes(tech.id)
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-white/10 text-slate-400 hover:border-violet-500/50'
                    }`}
                  >{tech.name}</button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}