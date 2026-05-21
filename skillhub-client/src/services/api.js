import axios from 'axios'
import keycloak from '../auth/keycloak'

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

api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      const refreshed = await keycloak.updateToken(30)
      if (refreshed) {
        localStorage.setItem('kc_token', keycloak.token)
        localStorage.setItem('kc_refresh_token', keycloak.refreshToken)
      }
    } catch {
      keycloak.logout({ redirectUri: window.location.origin })
      return Promise.reject(new Error('Session expired'))
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

export default api
