const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const proxyOptions = {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
    ws: true, // Enable WebSocket proxying for SockJS
  };

  // Proxy all backend paths through the dev server so requests are same-origin.
  // This is critical for HttpOnly cookie support:
  //   - SameSite=Lax cookies (refreshToken, XSRF-TOKEN) are NOT sent on cross-origin
  //     POST/PUT/DELETE requests (frontend:3000 → backend:8080).
  //   - By routing through the CRA dev server proxy, all requests appear same-origin
  //     to the browser, so cookies ARE included automatically.
  app.use(
    ['/api', '/ws', '/actuator', '/uploads', '/oauth2', '/login/oauth2'],
    createProxyMiddleware(proxyOptions)
  );
};