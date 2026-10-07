import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SingaporeRegion,
  PM25ApiResponse,
  RainfallApiResponse,
  TwoHourForecastResponse,
  AreaForecast,
  ApiHealthResponse,
  StationWithRain,
  UserLocation,
  WeatherEffectMode,
} from './types/weather';
import {
  fetchPM25Data,
  fetchRainfallData,
  fetchTwoHourForecast,
  fetchApiHealth,
  processRainfallStations,
  processAreaForecasts,
  getNearestRegion,
  calculateDistanceKm,
  getPM25QualityBand,
  getRainfallQualityBand,
  SINGAPORE_REGIONS_COORDS,
} from './services/neaApi';
import { WeatherCanvas } from './components/WeatherCanvas';
import { Header } from './components/Header';
import { LocationHero } from './components/LocationHero';
import { RegionGrid } from './components/RegionGrid';
import { RainfallMap } from './components/RainfallMap';
import { RainfallStationsList } from './components/RainfallStationsList';
import { PM25DetailView } from './components/PM25DetailView';
import { TwoHourForecastView } from './components/TwoHourForecastView';
import { ApiHealthModal } from './components/ApiHealthModal';
import { WeatherEffectControls } from './components/WeatherEffectControls';
import {
  Wind,
  Droplets,
  CloudSun,
  MapPin,
  Compass,
  AlertCircle,
  Activity,
  Layers,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [pm25Data, setPm25Data] = useState<PM25ApiResponse | null>(null);
  const [rainfallData, setRainfallData] = useState<RainfallApiResponse | null>(null);
  const [forecastData, setForecastData] = useState<TwoHourForecastResponse | null>(null);
  const [healthData, setHealthData] = useState<ApiHealthResponse | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('central');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationWithRain | null>(null);

  const [weatherEffectMode, setWeatherEffectMode] = useState<WeatherEffectMode>('auto');
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pm25' | 'forecast' | 'map' | 'stations' | 'advisory'>('overview');

  // Load all NEA data & Health metrics
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pm25Res, rainRes, forecastRes, healthRes] = await Promise.allSettled([
        fetchPM25Data(),
        fetchRainfallData(),
        fetchTwoHourForecast(),
        fetchApiHealth(),
      ]);

      if (pm25Res.status === 'fulfilled') {
        setPm25Data(pm25Res.value);
      }
      if (rainRes.status === 'fulfilled') {
        setRainfallData(rainRes.value);
      }
      if (forecastRes.status === 'fulfilled') {
        setForecastData(forecastRes.value);
      }
      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and 60-second periodic polling
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Process rainfall stations with distance calculation
  const processedStations: StationWithRain[] = useMemo(() => {
    if (!rainfallData) return [];
    return processRainfallStations(
      rainfallData,
      userLocation?.latitude,
      userLocation?.longitude
    );
  }, [rainfallData, userLocation]);

  // Process 2-hour area forecasts with distance calculation
  const processedForecasts: AreaForecast[] = useMemo(() => {
    if (!forecastData) return [];
    return processAreaForecasts(
      forecastData,
      userLocation?.latitude,
      userLocation?.longitude
    );
  }, [forecastData, userLocation]);

  // Find nearest forecast area to user
  const nearestForecast: AreaForecast | undefined = useMemo(() => {
    if (!processedForecasts.length) return undefined;
    if (userLocation) {
      return [...processedForecasts].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0];
    }
    return processedForecasts.find((f) => f.area.toLowerCase() === 'city') || processedForecasts[0];
  }, [processedForecasts, userLocation]);

  const forecastValidPeriod = forecastData?.data?.items?.[0]?.valid_period?.text || null;

  // Find nearest station to user or default to first in active region
  const nearestStation: StationWithRain | undefined = useMemo(() => {
    if (!processedStations.length) return undefined;
    if (selectedStation) return selectedStation;

    if (userLocation) {
      // Find closest station by km
      return [...processedStations].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0];
    }

    // Default to a representative station for the current region
    const regionCoords = SINGAPORE_REGIONS_COORDS[selectedRegion];
    return [...processedStations].sort((a, b) => {
      const distA = calculateDistanceKm(regionCoords.lat, regionCoords.lng, a.location.latitude, a.location.longitude);
      const distB = calculateDistanceKm(regionCoords.lat, regionCoords.lng, b.location.latitude, b.location.longitude);
      return distA - distB;
    })[0];
  }, [processedStations, userLocation, selectedStation, selectedRegion]);

  // Extract PM2.5 readings per region
  const regionalPM25 = useMemo(() => {
    return pm25Data?.data?.items?.[0]?.readings?.pm25_one_hourly || null;
  }, [pm25Data]);

  const currentPM25Value = regionalPM25?.[selectedRegion] ?? 0;
  const currentRainfallMm = nearestStation?.value ?? 0;

  // Geolocation detector
  const handleDetectLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const region = getNearestRegion(latitude, longitude);

        // Find nearest rainfall station
        let closestStation: StationWithRain | undefined;
        if (processedStations.length) {
          closestStation = [...processedStations].sort((a, b) => {
            const dA = calculateDistanceKm(latitude, longitude, a.location.latitude, a.location.longitude);
            const dB = calculateDistanceKm(latitude, longitude, b.location.latitude, b.location.longitude);
            return dA - dB;
          })[0];
        }

        setUserLocation({
          latitude,
          longitude,
          accuracy,
          region,
          nearestStation: closestStation,
          distanceToRegionKm: calculateDistanceKm(
            latitude,
            longitude,
            SINGAPORE_REGIONS_COORDS[region].lat,
            SINGAPORE_REGIONS_COORDS[region].lng
          ),
        });

        setSelectedRegion(region);
        if (closestStation) {
          setSelectedStation(closestStation);
        }
        setIsLocating(false);
        setLocationNotice(`Location detected! Showing data for ${region.toUpperCase()} region.`);
        setTimeout(() => setLocationNotice(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setLocationNotice('Could not access GPS location. You can select your region manually.');
        setTimeout(() => setLocationNotice(null), 4500);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [processedStations]);

  // Attempt auto-location once on initial mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const region = getNearestRegion(latitude, longitude);
          setUserLocation({
            latitude,
            longitude,
            accuracy,
            region,
          });
          setSelectedRegion(region);
        },
        () => {
          // Silent fallback on initial load
        },
        { timeout: 6000 }
      );
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white pb-20">
      {/* Dynamic Animated Canvas Weather Background */}
      <WeatherCanvas
        mode={weatherEffectMode}
        pm25Value={currentPM25Value}
        rainfallMm={currentRainfallMm}
      />

      {/* Main Header */}
      <Header
        onOpenHealth={() => setIsHealthModalOpen(true)}
        healthData={healthData}
        userLocation={userLocation}
        onRefreshAll={loadData}
        isRefreshing={isLoading}
      />

      {/* Geolocation Feedback Toast */}
      {locationNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 text-cyan-300 text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fadeIn">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>{locationNotice}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs (Mobile & Desktop) */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Overview & My Location</span>
          </button>

          <button
            onClick={() => setActiveTab('pm25')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pm25'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>PM2.5 Live Data (NEA)</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'forecast'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>2-Hour Forecast (Animated)</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'map'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Map</span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stations'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Rainfall Stations ({processedStations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advisory')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'advisory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>NEA Air & Rain Guide</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Card: User Location PM2.5 & Rainfall Monitor */}
            <LocationHero
              currentRegion={selectedRegion}
              onSelectRegion={(r) => {
                setSelectedRegion(r);
                setSelectedStation(null);
              }}
              pm25Value={currentPM25Value}
              nearestStation={nearestStation}
              userLocation={userLocation}
              isLocating={isLocating}
              onDetectLocation={handleDetectLocation}
              lastUpdatedPM25={pm25Data?.data?.items?.[0]?.updatedTimestamp || null}
              lastUpdatedRainfall={rainfallData?.data?.readings?.[0]?.timestamp || null}
              onRefresh={loadData}
              isRefreshing={isLoading}
              onViewPM25Details={() => setActiveTab('pm25')}
              nearestForecast={nearestForecast}
              forecastValidPeriod={forecastValidPeriod}
              onViewForecastDetails={() => setActiveTab('forecast')}
            />

            {/* Regional 5-Zone Comparison Grid */}
            <RegionGrid
              pm25Data={regionalPM25}
              selectedRegion={selectedRegion}
              onSelectRegion={(r) => {
                setSelectedRegion(r);
                setSelectedStation(null);
              }}
            />

            {/* Map Preview in Overview */}
            <RainfallMap
              stations={processedStations}
              pm25Data={regionalPM25}
              selectedRegion={selectedRegion}
              onSelectRegion={(r) => {
                setSelectedRegion(r);
                setSelectedStation(null);
              }}
              selectedStation={selectedStation}
              onSelectStation={(st) => setSelectedStation(st)}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* Tab: Dedicated PM2.5 Live Data Explorer */}
        {activeTab === 'pm25' && (
          <PM25DetailView
            pm25Data={pm25Data}
            selectedRegion={selectedRegion}
            onSelectRegion={(r) => setSelectedRegion(r)}
            onRefresh={loadData}
            isRefreshing={isLoading}
          />
        )}

        {/* Tab: Dedicated 2-Hour Weather Forecast (Animated) */}
        {activeTab === 'forecast' && (
          <TwoHourForecastView
            forecastData={forecastData}
            forecasts={processedForecasts}
            userLocation={userLocation}
            onRefresh={loadData}
            isRefreshing={isLoading}
          />
        )}

        {/* Tab 2: Map Focus */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <RainfallMap
              stations={processedStations}
              pm25Data={regionalPM25}
              selectedRegion={selectedRegion}
              onSelectRegion={(r) => {
                setSelectedRegion(r);
                setSelectedStation(null);
              }}
              selectedStation={selectedStation}
              onSelectStation={(st) => setSelectedStation(st)}
              userLocation={userLocation}
            />

            {/* Selected Station Quick Card */}
            {selectedStation && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedStation.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {selectedStation.id}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lat: {selectedStation.location.latitude}, Lng: {selectedStation.location.longitude}
                      {selectedStation.distanceKm !== undefined && ` • ${selectedStation.distanceKm} km from you`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-extrabold font-mono text-sky-400">
                    {selectedStation.value} mm
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    {getRainfallQualityBand(selectedStation.value).label}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Stations Directory */}
        {activeTab === 'stations' && (
          <RainfallStationsList
            stations={processedStations}
            selectedStation={selectedStation}
            onSelectStation={(st) => {
              setSelectedStation(st);
              const reg = getNearestRegion(st.location.latitude, st.location.longitude);
              setSelectedRegion(reg);
            }}
            userLocation={userLocation}
          />
        )}

        {/* Tab 4: Official NEA Advisory & Guidelines Guide */}
        {activeTab === 'advisory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PM2.5 Benchmark Guide */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Wind className="w-5 h-5 text-cyan-400" />
                <h3>NEA 1-Hourly PM2.5 Standards</h3>
              </div>
              <p className="text-xs text-slate-400">
                1-hour PM2.5 concentration is an indicator of current air quality and helps individuals make immediate decisions for outdoor activities.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { band: '0 – 55 µg/m³', label: 'Normal (Good)', color: '#10b981', desc: 'Air quality is acceptable. Normal outdoor activities can be enjoyed by everyone.' },
                  { band: '56 – 150 µg/m³', label: 'Elevated (Unhealthy)', color: '#f59e0b', desc: 'Hazy conditions. Vulnerable groups (elderly, children, heart/lung disease) should reduce strenuous outdoor exertion.' },
                  { band: '151 – 250 µg/m³', label: 'Very Unhealthy', color: '#ef4444', desc: 'Heavy haze. Healthy individuals should reduce prolonged outdoor exertion; vulnerable groups should avoid outdoor exertion.' },
                  { band: '> 250 µg/m³', label: 'Hazardous', color: '#a855f7', desc: 'Dangerous pollution levels. Everyone should avoid outdoor activities and stay in clean indoor spaces.' },
                ].map((item) => (
                  <div key={item.band} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: item.color }}>
                        {item.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">{item.band}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rainfall Intensity Guide */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Droplets className="w-5 h-5 text-sky-400" />
                <h3>NEA TB1 Rainfall Intensity Categories</h3>
              </div>
              <p className="text-xs text-slate-400">
                Measures 5-minute total precipitation in millimeters (mm) reported from over 80 automated tipping-bucket stations island-wide.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { band: '0.0 mm', label: 'Dry / No Rain', color: '#10b981', desc: 'No measurable precipitation in the latest 5-minute sampling interval.' },
                  { band: '0.2 – 2.5 mm', label: 'Light Rain / Drizzle', color: '#38bdf8', desc: 'Passing drizzle or light showers. Roads are slightly damp.' },
                  { band: '2.6 – 10.0 mm', label: 'Moderate Rain', color: '#3b82f6', desc: 'Continuous steady downpour. Wet road conditions and reduced visibility.' },
                  { band: '10.1 – 25.0 mm', label: 'Heavy Rain', color: '#8b5cf6', desc: 'Severe convective storm downpour. Risk of flash floods in flood-prone areas.' },
                  { band: '> 25.0 mm', label: 'Torrential Downpour', color: '#ec4899', desc: 'Extreme tropical squall. High flash flood warning.' },
                ].map((item) => (
                  <div key={item.band} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: item.color }}>
                        {item.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">{item.band}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Weather Effect Simulator Controls & Sound Toggle */}
      <WeatherEffectControls
        currentMode={weatherEffectMode}
        onSelectMode={setWeatherEffectMode}
        pm25Value={currentPM25Value}
        rainfallMm={currentRainfallMm}
      />

      {/* API Health Monitor Modal */}
      <ApiHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthData={healthData}
        isLoading={isLoading}
        onRefresh={loadData}
      />
    </div>
  );
}
