import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1/ticker': {
        target: 'https://api.upbit.com',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/v1/ticker?markets=KRW-BTC -> /v1/ticker?markets=KRW-BTC
          return path.replace(/^\/api/, '')
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Proxy]', req.method, req.url)
            console.log('[Target]', proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Response]', proxyRes.statusCode, req.url)
          })
          proxy.on('error', (err, req, res) => {
            console.error('[Error]', err.message)
          })
        },
      },
    },
  },
})
