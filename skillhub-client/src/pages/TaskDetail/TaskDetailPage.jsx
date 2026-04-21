import { useParams, useNavigate } from 'react-router-dom'
import { useTaskDetail } from '../../hooks/useTaskDetail'
import SubmitTaskForm from '../../components/tasks/SubmitTaskForm'

const difficultyConfig = {
  1: { label: 'Junior', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  2: { label: 'Middle', color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/20'  },
  3: { label: 'Senior', color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20'        },
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-slate-700'}>★</span>
      ))}
    </div>
  )
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useTaskDetail(id)
  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Loading...
    </div>
  )

  if (isError) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
      Failed to load task.
    </div>
  )

  const { task, reviews, questions, workSubmissions } = data
  const diff = difficultyConfig[task.difficulty] ?? difficultyConfig[0]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-white">{task.title}</h1>
            <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${diff.bg} ${diff.color}`}>
              {diff.label}
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed mb-6">{task.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>⏱ {task.estimatedTimeMinutes} min</span>
            <span>⚡ {task.xpReward} XP</span>
            <span className={task.isActive ? 'text-emerald-400' : 'text-slate-600'}>
              {task.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {task.tags.map(tag => (
                <span key={tag.id} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Technologies */}
          {task.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {task.technologies.map(tech => (
                <span key={tech.id} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  {tech.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Reviews <span className="text-slate-500 text-sm font-normal">({reviews.length})</span>
          </h2>
          {reviews.length === 0 ? (
            <p className="text-slate-500 text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-slate-900 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {review.user?.firstName} {review.user?.lastName}
                    </span>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-slate-400 text-sm">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Questions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Questions <span className="text-slate-500 text-sm font-normal">({questions.length})</span>
          </h2>
          {questions.length === 0 ? (
            <p className="text-slate-500 text-sm">No questions yet.</p>
          ) : (
            <div className="space-y-4">
              {questions.map(q => (
                <div key={q.id} className="bg-slate-900 border border-white/5 rounded-xl p-4">
                  <p className="text-white text-sm font-medium mb-1">{q.questionText}</p>
                  <p className="text-slate-500 text-xs mb-3">
                    {q.user?.firstName} {q.user?.lastName}
                  </p>
                  {q.answers?.length > 0 && (
                    <div className="space-y-2 pl-4 border-l border-white/10">
                      {q.answers.map((a, i) => (
                        <div key={i}>
                          <p className="text-slate-300 text-sm">{a.answerText}</p>
                          <p className="text-slate-500 text-xs">{a.user?.firstName} {a.user?.lastName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submissions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Submissions <span className="text-slate-500 text-sm font-normal">({workSubmissions.length})</span>
          </h2>
          {workSubmissions.length === 0 ? (
            <p className="text-slate-500 text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {workSubmissions.map(sub => (
                <div key={sub.id} className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {sub.userFirstName} {sub.userLastName}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(sub.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
         <div className="mt-6">
           <SubmitTaskForm task={task} />
         </div>
      </div>
    </div>
  )
}