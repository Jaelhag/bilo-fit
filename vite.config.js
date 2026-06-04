import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mobile-first personal app. host:true so it's reachable from a phone on the same network.
// base is '/mobility-coach/' for the GitHub Pages build, '/' for local dev.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/mobility-coach/' : '/',
  server: { host: true, port: 5180 },
}))
