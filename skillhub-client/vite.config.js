import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  proxy: {
    '/tasks': 'http://localhost:5000',
    '/work': 'http://localhost:5000',
    '/reviews': 'http://localhost:5000',
    '/aggregator': 'http://localhost:5000',
    '/keycloak-admin': {
      target: 'http://localhost:8080',
      rewrite: (path) => path.replace(/^\/keycloak-admin/, ''),
    }
  }
}})