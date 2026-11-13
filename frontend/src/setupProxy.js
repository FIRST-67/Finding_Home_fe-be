const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function setupProxy(app) {
  app.use(createProxyMiddleware('/api', {
    target: 'https://finding-home-dfe0.onrender.com',
    changeOrigin: true,
  }))
}
