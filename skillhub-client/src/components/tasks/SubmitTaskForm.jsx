import { useState } from 'react'
import keycloak from '../../auth/keycloak'
import { useSubmissionMethods, useCreateSubmission } from '../../hooks/useSubmissions'

export default function SubmitTaskForm({ task }) {
  const { data: methods } = useSubmissionMethods()
  const { mutateAsync, isPending } = useCreateSubmission()

  const [files, setFiles] = useState([{ deliveryMethodId: '', fileUrl: '' }])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const updateFile = (index, key, value) => {
    setFiles(f => f.map((file, i) => i === index ? { ...file, [key]: value } : file))
  }

  const addFile = () => setFiles(f => [...f, { deliveryMethodId: '', fileUrl: '' }])
  const removeFile = (index) => setFiles(f => f.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    setError(null)
    setSuccess(false)

    for (const file of files) {
      if (!file.deliveryMethodId) return setError('Select delivery method for all files')
      if (!file.fileUrl) return setError('Enter URL for all files')
    }

    try {
        await mutateAsync({
          taskId: task.id,
          taskName: task.title,
          userId: keycloak.subject,
          userFirstName: keycloak.tokenParsed?.given_name ?? 'Guest',
          userLastName: keycloak.tokenParsed?.family_name ?? 'User',
          files: files.map(f => ({
            deliveryMethodId: f.deliveryMethodId,
            fileUrl: f.fileUrl,
            })),
          })
      setSuccess(true)
      setFiles([{ deliveryMethodId: '', fileUrl: '' }])
      console.log('subject:', keycloak.subject)
      console.log('tokenParsed:', keycloak.tokenParsed)
    } catch {
      setError('Failed to submit')
    }
  }

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Submit Work</h2>

      <div className="space-y-3">
        {files.map((file, index) => (
          <div key={index} className="flex gap-3 items-start">
            <select
              value={file.deliveryMethodId}
              onChange={e => updateFile(index, 'deliveryMethodId', e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 w-40 shrink-0"
            >
              <option value="">Method...</option>
              {methods?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <input
              type="text"
              value={file.fileUrl}
              onChange={e => updateFile(index, 'fileUrl', e.target.value)}
              placeholder="https://github.com/..."
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />

            {files.length > 1 && (
              <button
                onClick={() => removeFile(index)}
                className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none pt-2"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addFile}
        className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
      >
        + Add file
      </button>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      {success && <p className="text-emerald-400 text-sm mt-3">Submitted successfully!</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  )
}