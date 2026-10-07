import React from 'react';
import { SingaporeRegion, StationWithRain, UserLocation, AreaForecast } from '../types/weather';
import { getPM25QualityBand, getRainfallQualityBand, SINGAPORE_REGIONS_COORDS, getWeatherForecastStyle } from '../services/neaApi';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import {
  MapPin,
  Navigation,
  Wind,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Compass,
  ChevronRight,
  Info,
  Calendar,
} from 'lucide-react';

interface LocationHeroProps {
  currentRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
  pm25Value: number | undefined;
  nearestStation: StationWithRain | undefined;
  userLocation: UserLocation | null;
  isLocating: boolean;
  onDetectLocation: () => void;
  lastUpdatedPM25: string | null;
  lastUpdatedRainfall: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewPM25Details?: () => void;
  nearestForecast?: AreaForecast | null;
  forecastValidPeriod?: string | null;
  onViewForecastDetails?: () => void;
}

export const LocationHero: React.FC<LocationHeroProps> = ({
  currentRegion,
  onSelectRegion,
  pm25Value = 0,
  nearestStation,
  userLocation,
  isLocating,
  onDetectLocation,
  lastUpdatedPM25,
  lastUpdatedRainfall,
  onRefresh,
  isRefreshing,
  onViewPM25Details,
  nearestForecast,
  forecastValidPeriod,
  onViewForecastDetails,
}) => {
  const pm25Band = getPM25QualityBand(pm25Value);
  const rainMm = nearestStation?.value ?? 0;
  const rainBand = getRainfallQualityBand(rainMm);
  const forecastStyle = nearestForecast ? getWeatherForecastStyle(nearestForecast.forecast) : null;

  // Gauge percentage calculation (0 to 300 scale)
  const gaugePercent = Math.min(100, Math.round((pm25Value / 200) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl p-5 sm:p-8 shadow-2xl">
      {/* Dynamic ambient color glow based on PM2.5 */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: pm25Band.color }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: rainBand.color }}
      />

      {/* Top Location Bar & GPS trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Singapore NEA Live Feed</span>
            </span>

            {userLocation ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Navigation className="w-3 h-3" />
                <span>GPS Active</span>
              </span>
            ) : null}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight flex items-center gap-2">
            <span>{SINGAPORE_REGIONS_COORDS[currentRegion]?.displayName || 'Singapore'} Region</span>
            <span className="text-slate-400 text-sm sm:text-base font-normal">
              {userLocation ? '(Your Location)' : '(Selected)'}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {nearestStation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Nearest Station: <strong className="text-slate-200">{nearestStation.name}</strong>
                {nearestStation.distanceKm !== undefined && (
                  <span className="text-slate-400">({nearestStation.distanceKm} km away)</span>
                )}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons: Geolocation & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onDetectLocation}
            disabled={isLocating}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              userLocation
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : userLocation ? 'Update GPS' : 'Locate My Area'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh NEA data"
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div className="py-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">Switch Region:</span>
        {(['central', 'north', 'south', 'east', 'west'] as SingaporeRegion[]).map((region) => {
          const isSelected = currentRegion === region;
          return (
            <button
              key={region}
              onClick={() => onSelectRegion(region)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition-all ${
                isSelected
                  ? 'bg-slate-100 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              {region}
            </button>
          );
        })}
      </div>

      {/* Animated 2-Hour Weather Outlook Banner */}
      {nearestForecast && forecastStyle && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 shadow-md">
              <AnimatedWeatherIcon type={forecastStyle.iconType} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  2-Hour Weather Outlook
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {forecastValidPeriod || 'Next 2 Hours'}
                </span>
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-2">
                <span>{nearestForecast.area}:</span>
                <span style={{ color: forecastStyle.color }}>{nearestForecast.forecast}</span>
              </div>
            </div>
          </div>

          {onViewForecastDetails && (
            <button
              onClick={onViewForecastDetails}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all"
            >
              <span>Explore 47 Areas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Grid: PM2.5 Card & Rainfall Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
        {/* PM2.5 Quality Status Card (7 columns) */}
        <div
          className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 border transition-all duration-500 bg-gradient-to-br ${pm25Band.bgGradient} ${pm25Band.borderColor} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Wind className="w-5 h-5" style={{ color: pm25Band.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      PM2.5 Air Quality
                    </h3>
                    {onViewPM25Details && (
                      <button
                        onClick={onViewPM25Details}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5"
                      >
                        <span>api/pm25</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">1-Hourly Concentration (NEA API)</p>
                </div>
              </div>

              {/* Status Band Badge */}
              <div className="flex items-center gap-2">
                <div
                  className="px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-sm"
                  style={{
                    backgroundColor: `${pm25Band.color}20`,
                    borderColor: `${pm25Band.color}60`,
                    color: pm25Band.color,
                  }}
                >
                  {pm25Band.label}
                </div>
              </div>
            </div>

            {/* Reading Number & Gauge */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-6xl sm:text-7xl font-extrabold tracking-tight font-mono"
                  style={{ color: pm25Band.color }}
                >
                  {pm25Value}
                </span>
                <span className="text-slate-400 text-lg font-semibold">µg/m³</span>
              </div>

              <div className="sm:text-right">
                <span className="text-xs font-semibold text-slate-400 block">NEA Benchmark Band</span>
                <span className="text-sm font-bold text-slate-200">{pm25Band.range}</span>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="h-3 w-full bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.max(5, gaugePercent)}%`,
                    backgroundColor: pm25Band.color,
                    boxShadow: `0 0 12px ${pm25Band.color}80`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                <span className="text-emerald-400">0 (Good)</span>
                <span className="text-amber-400">55 (Moderate)</span>
                <span className="text-rose-400">150 (Unhealthy)</span>
                <span className="text-purple-400">250+ (Hazardous)</span>
              </div>
            </div>
          </div>

          {/* Health Advisory Section */}
          <div className="mt-6 pt-5 border-t border-slate-800/60 bg-slate-950/40 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Official Health Advisory
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {pm25Band.advisory}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 flex flex-col gap-1 border-t border-slate-800/40 pt-2">
                  <span>
                    <strong className="text-slate-300">Public:</strong> {pm25Band.generalPublic}
                  </span>
                  <span>
                    <strong className="text-slate-300">Vulnerable:</strong> {pm25Band.vulnerableGroups}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rainfall Status Card (5 columns) */}
        <div className="lg:col-span-5 rounded-2xl p-5 sm:p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Droplets className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Rainfall Precipitation
                  </h3>
                  <p className="text-xs text-slate-400">5-Minute Total (TB1 Sensor)</p>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${rainBand.badgeBg}`}>
                {rainBand.label}
              </div>
            </div>

            {/* Rainfall Number & Status */}
            <div className="mt-6 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-6xl font-extrabold tracking-tight font-mono"
                  style={{ color: rainBand.color }}
                >
                  {rainMm}
                </span>
                <span className="text-slate-400 text-lg font-semibold">mm</span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold">Intensity Level</span>
                <span className="text-sm font-bold text-slate-200">{rainBand.range}</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              {rainBand.description}
            </p>
          </div>

          {/* Station metadata & Timestamp */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Reporting Sensor:</span>
              <strong className="text-slate-200 font-mono">
                {nearestStation?.deviceId || 'S111'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Updated:
              </span>
              <span className="text-slate-300 font-mono">
                {lastUpdatedRainfall
                  ? new Date(lastUpdatedRainfall).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Live'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
