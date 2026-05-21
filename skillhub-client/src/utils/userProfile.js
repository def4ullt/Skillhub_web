export const compressImage = (file, maxDim = 96, quality = 0.75) =>
  new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })

export const loadProfile = (userId) => {
  if (!userId) return { bio: '', avatar: null }
  try {
    const raw = localStorage.getItem(`profile_${userId}`)
    if (raw) return { bio: '', avatar: null, ...JSON.parse(raw) }
  } catch {}
  return { bio: '', avatar: null }
}

export const saveProfile = (userId, updates) => {
  if (!userId) return
  try {
    const existing = loadProfile(userId)
    localStorage.setItem(`profile_${userId}`, JSON.stringify({ ...existing, ...updates }))
  } catch {}
}
