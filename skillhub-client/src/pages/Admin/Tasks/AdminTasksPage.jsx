import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../../../services/taskService'
import { useFilters } from '../../../hooks/useTasks'
import { getKeycloakUsers } from '../../../utils/keycloak'
import { getUserId } from '../../../auth/keycloak'
import { useTaskHealthMap, HEALTH_COLOR, HEALTH_LABEL } from '../../../hooks/useTaskHealthMap'
import TaskFormModal from './TaskFormModal'

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

export default function AdminTasksPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalTask, setModalTask] = useState(null)
  const { data: filters } = useFilters()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks', page],
    queryFn: () => taskService.getAll({ page, pageSize: 10 }).then(r => r.data),
  })

  const { data: kcUsers = [] } = useQuery({
    queryKey: ['kc-users'],
    queryFn: getKeycloakUsers,
    staleTime: 5 * 60 * 1000,
  })
  const authorMap = {}
  kcUsers.forEach(u => {
    authorMap[u.id] = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || null
  })

  const healthMap = useTaskHealthMap()

  const remove = useMutation({
    mutationFn: (id) => taskService.delete(id),
    onSuccess: () => qc.invalidateQueries(['admin-tasks']),
  })

  const claim = useMutation({
    mutationFn: async (task) => {
      const detail = await taskService.getById(task.id).then(r => r.data)
      return taskService.update(task.id, {
        title: detail.title,
        description: detail.description,
        difficulty: detail.difficulty,
        estimatedTimeMinutes: detail.estimatedTimeMinutes,
        xpReward: detail.xpReward,
        isActive: detail.isActive,
        technologyIds: detail.technologies?.map(t => t.id) ?? [],
        tagIds: detail.tags?.map(t => t.id) ?? [],
        authorId: getUserId(),
      })
    },
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
        {data?.items?.map(task => {
          const healthInfo = healthMap[task.id]
          const health = healthInfo?.health ?? 'Neutral'
          const authorName = task.authorId && task.authorId !== EMPTY_GUID
            ? authorMap[task.authorId] ?? null
            : null
          return (
            <div key={task.id} className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <span className={`text-xs ${HEALTH_COLOR[health]}`}>
                      {HEALTH_LABEL[health]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {['', 'Junior', 'Middle', 'Senior'][task.difficulty]} · {task.xpReward} XP · {task.isActive ? 'Active' : 'Inactive'}
                    {authorName && <span className="text-slate-600"> · by {authorName}</span>}
                    {healthInfo && <span className="text-slate-600"> · {healthInfo.count} reviews</span>}
                  </p>
                </div>
                <div className="flex gap-3 ml-2 shrink-0">
                  {(!task.authorId || task.authorId === EMPTY_GUID) && (
                    <button
                      onClick={() => claim.mutate(task)}
                      disabled={claim.isPending}
                      className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
                    >
                      Claim
                    </button>
                  )}
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
            </div>
          )
        })}
      </div>

      {(data?.hasPrevious || data?.hasNext) && (
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!data?.hasPrevious}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">Page {data?.currentPage} of {data?.totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!data?.hasNext}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
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
