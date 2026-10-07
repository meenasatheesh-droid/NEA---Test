export type SingaporeRegion = 'north' | 'south' | 'east' | 'west' | 'central';

export interface RegionMetadata {
  name: SingaporeRegion;
  labelLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface PM25Reading {
  date: string;
  updatedTimestamp: string;
  timestamp: string;
  readings: {
    pm25_one_hourly: Record<SingaporeRegion, number>;
  };
}

export interface PM25ApiResponse {
  code: number;
  data: {
    regionMetadata: RegionMetadata[];
    items: PM25Reading[];
  };
  errorMsg: string;
  cached?: boolean;
}

export interface RainfallStation {
  id: string;
  deviceId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface RainfallReading {
  timestamp: string;
  data: Array<{
    stationId: string;
    value: number; // in mm
  }>;
}

export interface RainfallApiResponse {
  code: number;
  data: {
    stations: RainfallStation[];
    readings: RainfallReading[];
    readingType: string;
    readingUnit: string;
  };
  errorMsg: string;
  cached?: boolean;
}

export interface StationWithRain extends RainfallStation {
  value: number; // mm
  distanceKm?: number;
  timestamp?: string;
}

export interface AreaMetadata {
  name: string;
  label_location: {
    latitude: number;
    longitude: number;
  };
}

export interface AreaForecast {
  area: string;
  forecast: string;
  distanceKm?: number;
  coords?: {
    latitude: number;
    longitude: number;
  };
}

export interface TwoHourValidPeriod {
  start: string;
  end: string;
  text: string;
}

export interface TwoHourForecastItem {
  update_timestamp: string;
  timestamp: string;
  valid_period: TwoHourValidPeriod;
  forecasts: AreaForecast[];
}

export interface TwoHourForecastResponse {
  code: number;
  data: {
    area_metadata: AreaMetadata[];
    items: TwoHourForecastItem[];
  };
  errorMsg: string;
  cached?: boolean;
}

export interface ApiHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  services: {
    nea_pm25: {
      name: string;
      endpoint: string;
      status: 'up' | 'down' | 'degraded' | 'unknown';
      statusCode: number;
      latencyMs: number;
      lastUpdated: string | null;
      regionsAvailable: number;
      error: string | null;
    };
    nea_rainfall: {
      name: string;
      endpoint: string;
      status: 'up' | 'down' | 'degraded' | 'unknown';
      statusCode: number;
      latencyMs: number;
      lastUpdated: string | null;
      activeStations: number;
      error: string | null;
    };
    nea_two_hr_forecast: {
      name: string;
      endpoint: string;
      status: 'up' | 'down' | 'degraded' | 'unknown';
      statusCode: number;
      latencyMs: number;
      lastUpdated: string | null;
      areasCount: number;
      validPeriod: string | null;
      error: string | null;
    };
  };
  totalLatencyMs: number;
  environment: {
    nodeVersion: string;
    platform: string;
  };
}

export type WeatherEffectMode = 'auto' | 'rain' | 'drizzle' | 'haze' | 'sunny' | 'storm' | 'off';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  region: SingaporeRegion;
  nearestStation?: StationWithRain;
  distanceToRegionKm?: number;
}

export interface PM25QualityBand {
  level: 'normal' | 'elevated' | 'very_unhealthy' | 'hazardous';
  label: string;
  range: string;
  color: string;
  textColor: string;
  bgGradient: string;
  borderColor: string;
  advisory: string;
  generalPublic: string;
  vulnerableGroups: string;
}

export interface RainfallQualityBand {
  level: 'none' | 'light' | 'moderate' | 'heavy' | 'torrential';
  label: string;
  range: string;
  color: string;
  textColor: string;
  badgeBg: string;
  description: string;
}
