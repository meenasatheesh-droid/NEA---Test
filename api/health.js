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
      nea_two_hr_forecast: {
        name: 'NEA Real-time 2-Hour Weather Forecast API',
        endpoint: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
        status: 'unknown',
        statusCode: 0,
        latencyMs: 0,
        lastUpdated: null,
        areasCount: 0,
        validPeriod: null,
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

  // Check 2-Hour Forecast API
  const forecastStart = Date.now();
  try {
    const forecastRes = await fetch(results.services.nea_two_hr_forecast.endpoint, {
      headers: { 'User-Agent': 'SGAirRain-HealthMonitor/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    results.services.nea_two_hr_forecast.statusCode = forecastRes.status;
    results.services.nea_two_hr_forecast.latencyMs = Date.now() - forecastStart;

    if (forecastRes.ok) {
      const data = await forecastRes.json();
      if (data.code === 0 && data.data) {
        results.services.nea_two_hr_forecast.status = 'up';
        results.services.nea_two_hr_forecast.lastUpdated = data.data.items?.[0]?.update_timestamp || null;
        results.services.nea_two_hr_forecast.areasCount = data.data.items?.[0]?.forecasts?.length || 0;
        results.services.nea_two_hr_forecast.validPeriod = data.data.items?.[0]?.valid_period?.text || null;
      } else {
        results.services.nea_two_hr_forecast.status = 'degraded';
        results.services.nea_two_hr_forecast.error = data.errorMsg || 'Non-zero response code';
      }
    } else {
      results.services.nea_two_hr_forecast.status = 'down';
      results.services.nea_two_hr_forecast.error = `HTTP ${forecastRes.status}`;
    }
  } catch (err) {
    results.services.nea_two_hr_forecast.latencyMs = Date.now() - forecastStart;
    results.services.nea_two_hr_forecast.status = 'down';
    results.services.nea_two_hr_forecast.error = err.message || 'Fetch failed';
  }

  results.totalLatencyMs = Date.now() - startTime;

  // Determine overall status
  const pm25Status = results.services.nea_pm25.status;
  const rainStatus = results.services.nea_rainfall.status;
  const forecastStatus = results.services.nea_two_hr_forecast.status;

  if (pm25Status === 'up' && rainStatus === 'up' && forecastStatus === 'up') {
    results.status = 'healthy';
  } else if (pm25Status === 'up' || rainStatus === 'up' || forecastStatus === 'up') {
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
