// 간단한 프록시 서버 (개발용)
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
const PORT = 3001

app.use('/api', createProxyMiddleware({
  target: 'https://api.upbit.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // /api/v1/ticker -> /v1/ticker
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`)
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url}`)
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message)
    res.status(500).json({ error: 'Proxy error' })
  },
}))

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
})
