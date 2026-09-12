/**
 * ============================================================
 * METRO DEV-SERVER BACKEND PROXY
 * ============================================================
 *
 * Why this exists
 * ---------------
 * The Expo web bundle runs in the *user's browser*, but the API runs in the
 * dev sandbox on port 8001. The browser cannot reach `localhost:8001` (that is
 * the viewer's own machine) and, in a tunneled preview, cannot reach the
 * sandbox's private address either. It also cannot mix https page content with
 * an http API (mixed content) and would hit CORS on every request.
 *
 * The fix is the standard one: serve the API from the *same origin* as the app
 * and let the dev server forward it. `src/config/backend.ts` resolves the base
 * URL to '' on web, so the app issues relative `/api/...` requests, and this
 * plugin forwards them to the backend.
 *
 * It also forwards the Socket.IO namespace (`/socket.io`) including the
 * WebSocket upgrade, so realtime features work in the browser preview too.
 *
 * Implemented with node:http only — no extra dependency.
 */

const http = require('http');

const TARGET = process.env.BACKEND_PROXY_TARGET || 'http://127.0.0.1:8001';
const PROXY_PREFIXES = ['/api', '/socket.io', '/uploads', '/health'];

function shouldProxy(pathname) {
  return PROXY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function targetParts() {
  const url = new URL(TARGET);
  return {
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : 80)),
    base: url.pathname.replace(/\/$/, ''),
  };
}

/**
 * Metro/Expo dev-server middleware plugin.
 * `middleware` receives `{ req, res, next }`.
 */
function withBackendProxy(middleware) {
  const { host, port, base } = targetParts();

  middleware.push({
    // Runs before the bundler's own handlers.
    name: 'zenith-backend-proxy',
    path: (req, res, next) => {
      let pathname = '';
      try {
        pathname = new URL(req.url, 'http://localhost').pathname;
      } catch {
        return next();
      }

      if (!shouldProxy(pathname)) return next();

      const forwardPath = `${base}${req.url}`;

      const proxyReq = http.request(
        {
          host,
          port,
          method: req.method,
          path: forwardPath,
          // Pass headers through, minus the ones that would confuse the
          // backend about the original host.
          headers: { ...req.headers, host: `${host}:${port}` },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      );

      proxyReq.on('error', (err) => {
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(
          JSON.stringify({
            error: {
              message: `Dev proxy could not reach the backend at ${TARGET}`,
              code: 'BACKEND_PROXY_UNREACHABLE',
              statusCode: 502,
              detail: err.message,
              hint: 'Start the API with: cd backend && npm start',
            },
          })
        );
      });

      // Stream the request body (handles JSON and multipart uploads).
      req.pipe(proxyReq, { end: true });
    },
  });

  return middleware;
}

/**
 * Attach the WebSocket upgrade handler so Socket.IO works through the proxy.
 * Call with the dev server's underlying http.Server when available.
 */
function attachUpgrade(server) {
  if (!server || typeof server.on !== 'function') return;
  const { host, port, base } = targetParts();

  server.on('upgrade', (req, socket, head) => {
    let pathname = '';
    try {
      pathname = new URL(req.url, 'http://localhost').pathname;
    } catch {
      return;
    }
    if (!pathname.startsWith('/socket.io')) return;

    const upstream = http.request({
      host,
      port,
      method: 'GET',
      path: `${base}${req.url}`,
      headers: { ...req.headers, host: `${host}:${port}`, connection: 'Upgrade', upgrade: 'websocket' },
    });

    upstream.on('upgrade', (upstreamRes, upstreamSocket, upstreamHead) => {
      const statusLine = `HTTP/1.1 ${upstreamRes.statusCode} ${upstreamRes.statusMessage || ''}`.trim();
      const headerLines = Object.entries(upstreamRes.headers)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\r\n');
      socket.write(`${statusLine}\r\n${headerLines}\r\n\r\n`);
      if (upstreamHead && upstreamHead.length) socket.write(upstreamHead);
      if (head && head.length) upstreamSocket.write(head);

      upstreamSocket.pipe(socket);
      socket.pipe(upstreamSocket);

      const cleanup = () => {
        try { upstreamSocket.destroy(); } catch { /* already gone */ }
        try { socket.destroy(); } catch { /* already gone */ }
      };
      socket.on('error', cleanup);
      socket.on('close', cleanup);
      upstreamSocket.on('error', cleanup);
      upstreamSocket.on('close', cleanup);
    });

    upstream.on('error', () => {
      try { socket.destroy(); } catch { /* already gone */ }
    });

    upstream.end();
  });
}

module.exports = withBackendProxy;
module.exports.withBackendProxy = withBackendProxy;
module.exports.attachUpgrade = attachUpgrade;
module.exports.shouldProxy = shouldProxy;
module.exports.TARGET = TARGET;
