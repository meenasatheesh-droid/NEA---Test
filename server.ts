import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple memory cache to minimize NEA latency and guard against rate-limiting
let pm25Cache: { data: any; expiry: number } | null = null;
let rainCache: { data: any; expiry: number } | null = null;
let forecast2HrCache: { data: any; expiry: number } | null = null;
const CACHE_TTL_MS = 20_000; // 20 seconds

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  return fetch(url, {
    headers: { 'User-Agent': 'SGAirRain-Monitor/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON parsing
  app.use(express.json());

  // Health check routes (/api/health and /api/health.js)
  app.get('/api/health', healthHandler);
  app.get('/api/health.js', healthHandler);

  // NEA PM2.5 API proxy with fallback & caching
  app.get('/api/pm25', async (req, res) => {
    try {
      const now = Date.now();
      if (pm25Cache && now < pm25Cache.expiry) {
        return res.json({ ...pm25Cache.data, cached: true });
      }

      const response = await fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/pm25');
      if (!response.ok) {
        throw new Error(`NEA PM2.5 returned status ${response.status}`);
      }
      const data = await response.json();
      pm25Cache = { data, expiry: now + CACHE_TTL_MS };
      return res.json({ ...data, cached: false });
    } catch (err: any) {
      if (pm25Cache) {
        return res.json({ ...pm25Cache.data, cached: true, stale: true, error: err.message });
      }
      return res.status(502).json({
        code: -1,
        errorMsg: err.message || 'Failed to fetch PM2.5 data',
      });
    }
  });

  // NEA Rainfall API proxy with fallback & caching
  app.get('/api/rainfall', async (req, res) => {
    try {
      const now = Date.now();
      if (rainCache && now < rainCache.expiry) {
        return res.json({ ...rainCache.data, cached: true });
      }

      const response = await fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/rainfall');
      if (!response.ok) {
        throw new Error(`NEA Rainfall returned status ${response.status}`);
      }
      const data = await response.json();
      rainCache = { data, expiry: now + CACHE_TTL_MS };
      return res.json({ ...data, cached: false });
    } catch (err: any) {
      if (rainCache) {
        return res.json({ ...rainCache.data, cached: true, stale: true, error: err.message });
      }
      return res.status(502).json({
        code: -1,
        errorMsg: err.message || 'Failed to fetch rainfall data',
      });
    }
  });

  // NEA 2-Hour Weather Forecast API proxy with fallback & caching
  app.get('/api/two-hr-forecast', async (req, res) => {
    try {
      const now = Date.now();
      if (forecast2HrCache && now < forecast2HrCache.expiry) {
        return res.json({ ...forecast2HrCache.data, cached: true });
      }

      const response = await fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast');
      if (!response.ok) {
        throw new Error(`NEA 2-Hr Forecast returned status ${response.status}`);
      }
      const data = await response.json();
      forecast2HrCache = { data, expiry: now + CACHE_TTL_MS };
      return res.json({ ...data, cached: false });
    } catch (err: any) {
      if (forecast2HrCache) {
        return res.json({ ...forecast2HrCache.data, cached: true, stale: true, error: err.message });
      }
      return res.status(502).json({
        code: -1,
        errorMsg: err.message || 'Failed to fetch 2-hour forecast data',
      });
    }
  });

  // Dev vs Prod Vite handling
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
