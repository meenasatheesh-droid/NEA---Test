import {
  SingaporeRegion,
  PM25ApiResponse,
  RainfallApiResponse,
  ApiHealthResponse,
  StationWithRain,
  PM25QualityBand,
  RainfallQualityBand,
} from '../types/weather';

export const SINGAPORE_REGIONS_COORDS: Record<SingaporeRegion, { lat: number; lng: number; displayName: string }> = {
  north: { lat: 1.41803, lng: 103.82, displayName: 'North' },
  south: { lat: 1.29587, lng: 103.82, displayName: 'South' },
  east: { lat: 1.35735, lng: 103.94, displayName: 'East' },
  west: { lat: 1.35735, lng: 103.7, displayName: 'West' },
  central: { lat: 1.35735, lng: 103.82, displayName: 'Central' },
};

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest Singapore region for any coordinates
 */
export function getNearestRegion(lat: number, lng: number): SingaporeRegion {
  let nearest: SingaporeRegion = 'central';
  let minDistance = Infinity;

  (Object.keys(SINGAPORE_REGIONS_COORDS) as SingaporeRegion[]).forEach((region) => {
    const coords = SINGAPORE_REGIONS_COORDS[region];
    const dist = calculateDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = region;
    }
  });

  return nearest;
}

/**
 * Fetch PM2.5 readings (tries local proxy first, falls back to open NEA endpoint)
 */
export async function fetchPM25Data(): Promise<PM25ApiResponse> {
  try {
    const res = await fetch('/api/pm25', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 0) return data;
    }
  } catch (err) {
    console.warn('Backend proxy /api/pm25 failed, falling back to direct open data endpoint', err);
  }

  // Fallback direct
  const fallback = await fetch('https://api-open.data.gov.sg/v2/real-time/api/pm25', {
    signal: AbortSignal.timeout(8000),
  });
  if (!fallback.ok) throw new Error(`PM2.5 API failed with HTTP ${fallback.status}`);
  return fallback.json();
}

/**
 * Fetch Rainfall readings (tries local proxy first, falls back to open NEA endpoint)
 */
export async function fetchRainfallData(): Promise<RainfallApiResponse> {
  try {
    const res = await fetch('/api/rainfall', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 0) return data;
    }
  } catch (err) {
    console.warn('Backend proxy /api/rainfall failed, falling back to direct open data endpoint', err);
  }

  // Fallback direct
  const fallback = await fetch('https://api-open.data.gov.sg/v2/real-time/api/rainfall', {
    signal: AbortSignal.timeout(8000),
  });
  if (!fallback.ok) throw new Error(`Rainfall API failed with HTTP ${fallback.status}`);
  return fallback.json();
}

/**
 * Fetch API Health status from /api/health.js
 */
export async function fetchApiHealth(): Promise<ApiHealthResponse> {
  const res = await fetch('/api/health.js', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Health check failed with HTTP ${res.status}`);
  return res.json();
}

/**
 * Merges rainfall stations with latest reading values
 */
export function processRainfallStations(
  response: RainfallApiResponse,
  userLat?: number,
  userLng?: number
): StationWithRain[] {
  if (!response?.data?.stations || !response?.data?.readings?.[0]?.data) {
    return [];
  }

  const stations = response.data.stations;
  const readingsMap = new Map<string, number>();
  const timestamp = response.data.readings[0].timestamp;

  response.data.readings[0].data.forEach((r) => {
    readingsMap.set(r.stationId, r.value);
  });

  return stations.map((station) => {
    const value = readingsMap.get(station.id) ?? 0;
    const distanceKm =
      userLat !== undefined && userLng !== undefined
        ? calculateDistanceKm(userLat, userLng, station.location.latitude, station.location.longitude)
        : undefined;

    return {
      ...station,
      value,
      distanceKm,
      timestamp,
    };
  });
}

/**
 * NEA PM2.5 Official 1-Hourly Bands and Health Advisories
 */
export function getPM25QualityBand(value: number): PM25QualityBand {
  if (value <= 55) {
    return {
      level: 'normal',
      label: 'Normal (Good)',
      range: '0 – 55 µg/m³',
      color: '#10b981', // emerald-500
      textColor: 'text-emerald-400',
      bgGradient: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/40',
      advisory: 'Air quality is safe. Perfect for outdoor activities, exercising, and sports.',
      generalPublic: 'Normal outdoor activities may be carried out as usual.',
      vulnerableGroups: 'Safe for elderly, pregnant women, and children.',
    };
  }

  if (value <= 150) {
    return {
      level: 'elevated',
      label: 'Elevated (Unhealthy)',
      range: '56 – 150 µg/m³',
      color: '#f59e0b', // amber-500
      textColor: 'text-amber-400',
      bgGradient: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'border-amber-500/40',
      advisory: 'Haze detected. Vulnerable individuals should reduce strenuous outdoor exertion.',
      generalPublic: 'Healthy individuals can continue normal activities but avoid prolonged heavy exertion.',
      vulnerableGroups: 'Elderly, pregnant women & people with asthma or heart conditions should stay indoors.',
    };
  }

  if (value <= 250) {
    return {
      level: 'very_unhealthy',
      label: 'Very Unhealthy',
      range: '151 – 250 µg/m³',
      color: '#ef4444', // red-500
      textColor: 'text-rose-400',
      bgGradient: 'from-rose-500/20 to-red-500/10',
      borderColor: 'border-rose-500/40',
      advisory: 'Significant haze risk. Minimize prolonged outdoor exertion for all persons.',
      generalPublic: 'Reduce outdoor physical exertion. Wear N95 mask if outdoors for extended periods.',
      vulnerableGroups: 'Avoid outdoor exertion. Stay in clean air-conditioned indoor environments.',
    };
  }

  return {
    level: 'hazardous',
    label: 'Hazardous',
    range: '> 250 µg/m³',
    color: '#a855f7', // purple-500
    textColor: 'text-purple-400',
    bgGradient: 'from-purple-500/25 to-violet-500/15',
    borderColor: 'border-purple-500/50',
    advisory: 'Hazardous pollution levels. Everyone should avoid outdoor activities.',
    generalPublic: 'Stay indoors, keep windows closed, and use high-efficiency air filters.',
    vulnerableGroups: 'High health hazard. Strictly avoid all outdoor exposure.',
  };
}

/**
 * NEA TB1 Rainfall 5-Minute Intensity Quality Bands
 */
export function getRainfallQualityBand(mm: number): RainfallQualityBand {
  if (mm <= 0) {
    return {
      level: 'none',
      label: 'Dry / No Rain',
      range: '0.0 mm',
      color: '#10b981',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      description: 'Clear conditions with no precipitation recorded in the last 5 minutes.',
    };
  }

  if (mm <= 2.5) {
    return {
      level: 'light',
      label: 'Light Rain',
      range: '0.2 – 2.5 mm',
      color: '#38bdf8', // sky-400
      textColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
      description: 'Light shower or drizzle. An umbrella is recommended for outdoor walking.',
    };
  }

  if (mm <= 10.0) {
    return {
      level: 'moderate',
      label: 'Moderate Rain',
      range: '2.6 – 10.0 mm',
      color: '#3b82f6', // blue-500
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      description: 'Steady rainfall. Expect wet road surfaces and reduced visibility.',
    };
  }

  if (mm <= 25.0) {
    return {
      level: 'heavy',
      label: 'Heavy Rain',
      range: '10.1 – 25.0 mm',
      color: '#8b5cf6', // violet-500
      textColor: 'text-violet-400',
      badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
      description: 'Intense downpour. Flash flood warnings may be active in low-lying areas.',
    };
  }

  return {
    level: 'torrential',
    label: 'Torrential Downpour',
    range: '> 25.0 mm',
    color: '#ec4899', // pink-500
    textColor: 'text-pink-400',
    badgeBg: 'bg-pink-500/20 border-pink-500/40 text-pink-300 animate-pulse',
    description: 'Extreme cloudburst. Take shelter immediately and avoid traveling on flooded roads.',
  };
}
