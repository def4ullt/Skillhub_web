import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../../../services/taskService'
import { useFilters } from '../../../hooks/useTasks'
import TaskFormModal from './TaskFormModal'

export default function AdminTasksPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalTask, setModalTask] = useState(null) // null = closed, {} = create, {id,...} = edit
  const { data: filters } = useFilters()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks', page],
    queryFn: () => taskService.getAll({ page: page, pageSize: 10 }).then(r => {
    console.log('page state:', page, 'response:', r.data)
    return r.data
    }),
  })

  const remove = useMutation({
    mutationFn: (id) => taskService.delete(id),
    onSuccess: () => qc.invalidateQueries(['admin-tasks']),
  })

  if (isLoading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Tasks</h2>
        <button
          onClick={() => setModalTask({})}
          className="text-sm px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          + New Task
        </button>
      </div>

      <div className="space-y-2">
        {data?.items?.map(task => (
          <div key={task.id} className="flex items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{task.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {['', 'Junior', 'Middle', 'Senior'][task.difficulty]} · {task.xpReward} XP · {task.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="flex gap-3 ml-4">
              <button
                onClick={() => setModalTask(task)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => remove.mutate(task.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex gap-2 mt-6">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                p === page ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modalTask !== null && (
        <TaskFormModal
          task={modalTask}
          filters={filters}
          onClose={() => setModalTask(null)}
          onSaved={() => { qc.invalidateQueries(['admin-tasks']); setModalTask(null) }}
        />
      )}
    </div>
  )
}