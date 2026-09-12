#!/usr/bin/env node
/**
 * ============================================================
 * SINGLE-ORIGIN DEV PROXY
 * ============================================================
 *
 * Sits in front of both servers and presents ONE origin to the browser:
 *
 *     browser  ──►  dev-proxy (:8080, 0.0.0.0)
 *                     ├── /api/*         ──► backend   (:8001)
 *                     ├── /socket.io/*   ──► backend   (:8001)  [incl. WS upgrade]
 *                     ├── /uploads/*     ──► backend   (:8001)
 *                     ├── /health*       ──► backend   (:8001)
 *                     └── everything else ─► expo web  (:8081)  [incl. HMR WS upgrade]
 *
 * Why: the Expo web bundle executes in the *viewer's* browser. It cannot call
 * `localhost:8001` (that resolves to the viewer's own machine), it cannot mix
 * an https page with an http API, and it would trip CORS on every request.
 * Serving the app and the API from one origin removes all three problems, and
 * it means the frontend can use relative `/api/...` URLs (which is exactly
 * what `frontend/src/config/backend.ts` does on web).
 *
 * Usage:
 *   node scripts/dev-proxy.js                # 8080 -> 8001 (api) + 8081 (expo)
 *   PORT=9000 node scripts/dev-proxy.js
 *
 * No dependencies beyond node:http.
 */

const http = require('http');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:8001';
const WEB_TARGET = process.env.WEB_TARGET || 'http://127.0.0.1:8081';

const api = new URL(API_TARGET);
const web = new URL(WEB_TARGET);

const API_PREFIXES = ['/api', '/socket.io', '/uploads', '/health', '/metrics'];

const isApiPath = (pathname) =>
  API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function route(req) {
  let pathname = '/';
  try {
    pathname = new URL(req.url, 'http://proxy.local').pathname;
  } catch {
    /* keep default */
  }
  const target = isApiPath(pathname) ? api : web;
  return { target, pathname };
}

function proxyRequest(req, res) {
  const { target } = route(req);

  const upstream = http.request(
    {
      hostname: target.hostname,
      port: target.port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: target.host,
        // Let the backend see the real client for rate limiting / logging.
        'x-forwarded-for': req.socket.remoteAddress,
        'x-forwarded-proto': 'http',
        'x-forwarded-host': req.headers.host,
      },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res, { end: true });
    }
  );

  upstream.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(
      JSON.stringify({
        error: {
          message: `Dev proxy could not reach ${target.origin}`,
          code: 'UPSTREAM_UNREACHABLE',
          statusCode: 502,
          detail: err.message,
          hint: isApiPath(req.url || '')
            ? 'Start the API:  cd backend && npm start'
            : 'Start Expo web: cd frontend && npx expo start --web --port 8081',
        },
      })
    );
  });

  upstream.setTimeout(120000, () => upstream.destroy(new Error('upstream timeout')));
  req.pipe(upstream, { end: true });
}

/**
 * WebSocket / HTTP upgrade handling.
 * Both Expo HMR and Socket.IO need this; without it the browser preview shows
 * the app but never receives realtime events and never hot-reloads.
 */
function proxyUpgrade(req, socket, head) {
  const { target } = route(req);

  const upstream = http.request({
    hostname: target.hostname,
    port: target.port,
    method: 'GET',
    path: req.url,
    headers: {
      ...req.headers,
      host: target.host,
      connection: 'Upgrade',
      upgrade: req.headers.upgrade || 'websocket',
    },
  });

  const destroyQuietly = (s) => {
    try {
      s.destroy();
    } catch {
      /* already closed */
    }
  };

  upstream.on('upgrade', (upstreamRes, upstreamSocket, upstreamHead) => {
    const status = `HTTP/1.1 ${upstreamRes.statusCode || 101} ${upstreamRes.statusMessage || ''}`.trim();
    const headers = Object.entries(upstreamRes.headers)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\r\n');

    try {
      socket.write(`${status}\r\n${headers}\r\n\r\n`);
      if (upstreamHead && upstreamHead.length) socket.write(upstreamHead);
      if (head && head.length) upstreamSocket.write(head);
    } catch {
      destroyQuietly(socket);
      destroyQuietly(upstreamSocket);
      return;
    }

    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);

    socket.on('error', () => destroyQuietly(upstreamSocket));
    socket.on('close', () => destroyQuietly(upstreamSocket));
    upstreamSocket.on('error', () => destroyQuietly(socket));
    upstreamSocket.on('close', () => destroyQuietly(socket));
  });

  upstream.on('error', (err) => {
    console.warn(`[proxy] upgrade to ${target.origin}${req.url} failed: ${err.message}`);
    destroyQuietly(socket);
  });

  upstream.setTimeout(600000, () => destroyQuietly(upstream));
  upstream.end();
}

const server = http.createServer((req, res) => {
  // A tiny status page for the proxy itself (never forwarded).
  if (req.url === '/__proxy') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        proxy: 'zenith-dev-proxy',
        listening: `${HOST}:${PORT}`,
        apiTarget: API_TARGET,
        webTarget: WEB_TARGET,
        apiPrefixes: API_PREFIXES,
        uptimeSeconds: Math.round(process.uptime()),
      })
    );
    return;
  }
  proxyRequest(req, res);
});

server.on('upgrade', proxyUpgrade);
server.on('clientError', (err, socket) => {
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch {
    /* socket already gone */
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[proxy] listening on http://${HOST}:${PORT}`);
  console.log(`[proxy]   ${API_PREFIXES.join(', ')}  ->  ${API_TARGET}`);
  console.log(`[proxy]   everything else       ->  ${WEB_TARGET}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[proxy] ${signal} — closing`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
