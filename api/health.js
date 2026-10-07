/**
 * Health check handler for NEA Real-Time PM2.5 and Rainfall APIs
 */

export async function checkApiHealth() {
  const startTime = Date.now();

  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      nea_pm25: {
        name: 'NEA Real-time PM2.5 API',
        endpoint: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
        status: 'unknown',
        statusCode: 0,
        latencyMs: 0,
        lastUpdated: null,
        regionsAvailable: 0,
        error: null,
      },
      nea_rainfall: {
        name: 'NEA Real-time Rainfall API',
        endpoint: 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
        status: 'unknown',
        statusCode: 0,
        latencyMs: 0,
        lastUpdated: null,
        activeStations: 0,
        error: null,
      },
    },
    totalLatencyMs: 0,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  };

  // Check PM2.5 API
  const pm25Start = Date.now();
  try {
    const pm25Res = await fetch(results.services.nea_pm25.endpoint, {
      headers: { 'User-Agent': 'SGAirRain-HealthMonitor/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    results.services.nea_pm25.statusCode = pm25Res.status;
    results.services.nea_pm25.latencyMs = Date.now() - pm25Start;

    if (pm25Res.ok) {
      const data = await pm25Res.json();
      if (data.code === 0 && data.data) {
        results.services.nea_pm25.status = 'up';
        results.services.nea_pm25.lastUpdated = data.data.items?.[0]?.updatedTimestamp || null;
        results.services.nea_pm25.regionsAvailable = Object.keys(data.data.items?.[0]?.readings?.pm25_one_hourly || {}).length;
      } else {
        results.services.nea_pm25.status = 'degraded';
        results.services.nea_pm25.error = data.errorMsg || 'Non-zero response code';
      }
    } else {
      results.services.nea_pm25.status = 'down';
      results.services.nea_pm25.error = `HTTP ${pm25Res.status}`;
    }
  } catch (err) {
    results.services.nea_pm25.latencyMs = Date.now() - pm25Start;
    results.services.nea_pm25.status = 'down';
    results.services.nea_pm25.error = err.message || 'Fetch failed';
  }

  // Check Rainfall API
  const rainStart = Date.now();
  try {
    const rainRes = await fetch(results.services.nea_rainfall.endpoint, {
      headers: { 'User-Agent': 'SGAirRain-HealthMonitor/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    results.services.nea_rainfall.statusCode = rainRes.status;
    results.services.nea_rainfall.latencyMs = Date.now() - rainStart;

    if (rainRes.ok) {
      const data = await rainRes.json();
      if (data.code === 0 && data.data) {
        results.services.nea_rainfall.status = 'up';
        results.services.nea_rainfall.lastUpdated = data.data.readings?.[0]?.timestamp || null;
        results.services.nea_rainfall.activeStations = data.data.stations?.length || 0;
      } else {
        results.services.nea_rainfall.status = 'degraded';
        results.services.nea_rainfall.error = data.errorMsg || 'Non-zero response code';
      }
    } else {
      results.services.nea_rainfall.status = 'down';
      results.services.nea_rainfall.error = `HTTP ${rainRes.status}`;
    }
  } catch (err) {
    results.services.nea_rainfall.latencyMs = Date.now() - rainStart;
    results.services.nea_rainfall.status = 'down';
    results.services.nea_rainfall.error = err.message || 'Fetch failed';
  }

  results.totalLatencyMs = Date.now() - startTime;

  // Determine overall status
  const pm25Status = results.services.nea_pm25.status;
  const rainStatus = results.services.nea_rainfall.status;

  if (pm25Status === 'up' && rainStatus === 'up') {
    results.status = 'healthy';
  } else if (pm25Status === 'up' || rainStatus === 'up') {
    results.status = 'degraded';
  } else {
    results.status = 'unhealthy';
  }

  return results;
}

// Express handler
export default async function healthHandler(req, res) {
  try {
    const health = await checkApiHealth();
    const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(httpStatus).json(health);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
