import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { technologyService } from '../../../services/taskService'

export default function AdminTechnologiesPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState(null)

  const { data: technologies, isLoading } = useQuery({
    queryKey: ['technologies'],
    queryFn: () => technologyService.getAll().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => technologyService.create({ name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technologies'] })
      setNewName('')
    },
    onError: () => setError('Failed to create technology'),
  })

  const update = useMutation({
    mutationFn: () => technologyService.update(editId, { name: editName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technologies'] })
      setEditId(null)
      setEditName('')
    },
    onError: () => setError('Failed to update technology'),
  })

  const remove = useMutation({
    mutationFn: (id) => technologyService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technologies'] }),
    onError: () => setError('Failed to delete technology'),
  })

  if (isLoading) return <p className="text-slate-500 text-sm">Loading...</p>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Technologies</h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && newName && create.mutate()}
          placeholder="New technology name..."
          className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={() => newName && create.mutate()}
          disabled={create.isPending}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm transition-colors"
        >
          Add
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <div className="space-y-2">
        {technologies?.map(tech => (
          <div
            key={tech.id}
            className="flex items-center justify-between bg-slate-900 border border-white/5 rounded-xl px-4 py-3"
          >
            {editId === tech.id ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && update.mutate()}
                className="bg-transparent text-sm text-white focus:outline-none border-b border-violet-500 flex-1 mr-4"
                autoFocus
              />
            ) : (
              <span className="text-sm text-white">{tech.name}</span>
            )}

            <div className="flex gap-3">
              {editId === tech.id ? (
                <>
                  <button
                    onClick={() => update.mutate()}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditId(tech.id); setEditName(tech.name) }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove.mutate(tech.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}