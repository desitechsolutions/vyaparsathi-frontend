const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    ['/api', '/auth'], // Add any other base paths your backend uses
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      onProxyRes: function (proxyRes, req, res) {
        // This ensures the browser accepts the cookie even if domains differ slightly in dev
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
    })
  );
};