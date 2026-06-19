import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function readBackendPort() {
  try {
    const backendEnvPath = path.resolve(process.cwd(), '../backend/.env')
    const envText = fs.readFileSync(backendEnvPath, 'utf8')
    const match = envText.match(/^PORT=(.+)$/m)
    return match?.[1]?.trim() || null
  } catch {
    return null
  }
}

/** @param {string} mode */
function apiProxyTarget(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  const port = readBackendPort() || process.env.PORT || '3002'
  return env.VITE_DEV_API_PROXY || process.env.VITE_DEV_API_PROXY || `http://127.0.0.1:${port}`
}

export default defineConfig(({ mode }) => {
  const apiTarget = apiProxyTarget(mode)
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
  }

  return {
    plugins: [react(), tailwindcss()],
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
