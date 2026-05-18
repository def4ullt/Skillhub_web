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

const refreshToken = async () => {
  const res = await fetch(
    'http://localhost:8080/realms/skillhub/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'skillhub-client',
        refresh_token: keycloak.refreshToken,
      }),
    }
  )
  if (!res.ok) throw new Error('Failed to refresh token')
  const data = await res.json()
  keycloak.token = data.access_token
  keycloak.refreshToken = data.refresh_token
  keycloak.tokenParsed = JSON.parse(atob(data.access_token.split('.')[1]))
  localStorage.setItem('kc_token', data.access_token)
  localStorage.setItem('kc_refresh_token', data.refresh_token)
}

api.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    const parsed = keycloak.tokenParsed
    const isExpired = parsed && Date.now() / 1000 > parsed.exp - 30
    if (isExpired) {
      try {
        await refreshToken()
      } catch {
        window.location.href = '/'
      }
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

export default api