import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** @param {string} mode */
function apiProxyTarget(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  const port = env.PORT || process.env.PORT || '3002'
  return env.VITE_DEV_API_PROXY || process.env.VITE_DEV_API_PROXY || `http://127.0.0.1:${port}`
}

export default defineConfig(({ mode }) => {
  const apiTarget = apiProxyTarget(mode)
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
  }

  return {
    plugins: [react()],
    build: {
      outDir: '../backend/dist',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': apiProxy,
        '/uploads': apiProxy,
      },
    },
    preview: {
      proxy: {
        '/api': apiProxy,
        '/uploads': apiProxy,
      },
    },
  }
})
