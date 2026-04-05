const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, '') || '';
const DIST = path.join(__dirname, 'dist');
const UNITY_BUILD_DIST = path.join(DIST, 'unity-build', 'Build');
const UNITY_DIST = path.join(DIST, 'unity-build');

async function proxyApiRequest(req, res) {
  if (!BACKEND_URL) {
    res.status(503).json({
      error: 'Backend is not configured. Set BACKEND_URL on the frontend Railway service.',
    });
    return;
  }

  try {
    const targetUrl = new URL(req.originalUrl, BACKEND_URL);
    const requestHeaders = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        requestHeaders.set(key, value.join(', '));
      } else {
        requestHeaders.set(key, value);
      }
    }

    requestHeaders.set('host', new URL(BACKEND_URL).host);

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: requestHeaders,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') {
        return;
      }

      res.setHeader(key, value);
    });

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(responseBuffer);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to contact backend service.',
    });
  }
}

// Required for Unity WebGL (SharedArrayBuffer)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json({ limit: '1mb' }));

app.options('/api/*', (_req, res) => {
  res.sendStatus(204);
});

app.all('/api/*', proxyApiRequest);

app.use('/unity-build', express.static(UNITY_DIST));
app.use('/unity-build/Build', express.static(UNITY_BUILD_DIST, {
  setHeaders: (res, filePath) => {
    if (/\.(data|wasm|js)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.use(express.static(DIST));

// SPA fallback
app.get('*', (req, res) => {
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/unity-build/') ||
    req.path.startsWith('/assets/') ||
    req.path.startsWith('/signs/') ||
    /\.[a-z0-9]+$/i.test(req.path)
  ) {
    res.sendStatus(404);
    return;
  }

  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});
