import axios from 'axios'

const api = axios.create({
  baseURL: '',
  paramsSerializer: (params) => {
    const parts = []
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        value.forEach(v => parts.push(`${key}=${encodeURIComponent(v)}`))
      } else {
        parts.push(`${key}=${encodeURIComponent(value)}`)
      }
    }
    return parts.join('&')
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api