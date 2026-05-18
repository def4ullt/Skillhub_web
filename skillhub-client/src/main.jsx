import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import keycloak from './auth/keycloak'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

keycloak.init({ 
  onLoad: 'check-sso',
  checkLoginIframe: false,
  token: localStorage.getItem('kc_token') ?? undefined,
  refreshToken: localStorage.getItem('kc_refresh_token') ?? undefined
}).then((authenticated) => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App authenticated={authenticated} />
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}).catch(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App authenticated={false} />
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})