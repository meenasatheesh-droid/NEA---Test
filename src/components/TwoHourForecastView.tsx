import React, { useState, useMemo } from 'react';
import { TwoHourForecastResponse, AreaForecast, UserLocation } from '../types/weather';
import { getWeatherForecastStyle } from '../services/neaApi';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import {
  Clock,
  Search,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  Code,
  Compass,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface TwoHourForecastViewProps {
  forecastData: TwoHourForecastResponse | null;
  forecasts: AreaForecast[];
  userLocation: UserLocation | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const TwoHourForecastView: React.FC<TwoHourForecastViewProps> = ({
  forecastData,
  forecasts,
  userLocation,
  onRefresh,
  isRefreshing,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<AreaForecast | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const endpointUrl = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const item = forecastData?.data?.items?.[0];
  const validPeriod = item?.valid_period;

  // Nearest forecast area to user (by GPS distance)
  const nearestArea = useMemo(() => {
    if (!forecasts.length) return null;
    if (userLocation) {
      return [...forecasts].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0];
    }
    // Default to central/City
    return forecasts.find((f) => f.area.toLowerCase() === 'city') || forecasts[0];
  }, [forecasts, userLocation]);

  // Active highlighted area
  const activeArea = selectedArea || nearestArea;
  const activeStyle = activeArea ? getWeatherForecastStyle(activeArea.forecast) : null;

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return forecasts.filter((f) => {
      const matchesSearch = f.area.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filterCategory === 'all') return true;
      const style = getWeatherForecastStyle(f.forecast);
      return style.category === filterCategory;
    });
  }, [forecasts, search, filterCategory]);

  // Calculate conditions summary
  const summaryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Thunderstorm': 0,
      'Rain / Showers': 0,
      'Cloudy': 0,
      'Clear / Fair': 0,
      'Haze': 0,
    };
    forecasts.forEach((f) => {
      const style = getWeatherForecastStyle(f.forecast);
      counts[style.category] = (counts[style.category] || 0) + 1;
    });
    return counts;
  }, [forecasts]);

  // Singapore bounds for map projection
  const SG_BOUNDS = {
    minLat: 1.18,
    maxLat: 1.48,
    minLng: 103.6,
    maxLng: 104.05,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Validity Period Bar */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                NEA Real-Time 2-Hour Outlook
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
              <span>Singapore 2-Hour Weather Forecast</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                {forecasts.length} Areas
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Source: <code className="text-cyan-400 font-mono">https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'API URL Copied' : 'Copy API URL'}</span>
            </button>

            <a
              href={endpointUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Raw API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Valid Period Card with Animated Progress */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Forecast Validity Window
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-white">
                {validPeriod?.text || 'Next 2 Hours'}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Updated: {item?.update_timestamp ? new Date(item.update_timestamp).toLocaleTimeString() : 'Live'}
              </span>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(summaryCounts).map(([cat, count]) => {
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    filterCategory === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{cat}:</span>
                  <span className="font-mono text-cyan-400">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Nearest Area Highlight Card (Animated) */}
      {activeArea && activeStyle && (
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border-slate-800`}
        >
          {/* Animated background glow */}
          <div
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700 animate-pulse"
            style={{ backgroundColor: activeStyle.color }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Large Animated Weather Icon */}
              <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl shrink-0">
                <AnimatedWeatherIcon type={activeStyle.iconType} size="xl" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    {userLocation && activeArea.distanceKm !== undefined ? 'Your Nearest Town' : 'Featured Town'}
                  </span>
                  {activeArea.distanceKm !== undefined && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {activeArea.distanceKm} km away
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-white mt-1 tracking-tight">
                  {activeArea.area}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${activeStyle.badgeBg}`}
                  >
                    {activeArea.forecast}
                  </span>
                  <span className="text-xs text-slate-400">Valid: {validPeriod?.text}</span>
                </div>
              </div>
            </div>

            {/* Quick area details */}
            <div className="md:text-right space-y-1.5 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 block">Condition Category</span>
              <span className="text-lg font-extrabold" style={{ color: activeStyle.color }}>
                {activeStyle.category}
              </span>
              <div className="text-xs text-slate-400">
                {activeArea.coords && (
                  <span className="font-mono">
                    Lat {activeArea.coords.latitude.toFixed(2)}, Lng {activeArea.coords.longitude.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher, Filter, & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search town (e.g. Woodlands, Changi, Tampines, Bedok, City)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid View ({filteredForecasts.length})
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Map Overlay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredForecasts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              No Singapore areas found matching "{search}".
            </div>
          ) : (
            filteredForecasts.map((f) => {
              const style = getWeatherForecastStyle(f.forecast);
              const isSelected = activeArea?.area === f.area;

              return (
                <div
                  key={f.area}
                  onClick={() => setSelectedArea(f)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-cyan-400 bg-slate-900 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                      : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {f.area}
                      </span>
                    </div>

                    {/* Animated Mini Weather Icon */}
                    <div className="py-2 flex items-center justify-center">
                      <AnimatedWeatherIcon type={style.iconType} size="md" />
                    </div>

                    <div className="text-center mt-1">
                      <span className="text-[11px] font-bold block truncate" style={{ color: style.color }}>
                        {f.forecast}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 text-center text-[10px] text-slate-500 font-mono">
                    {f.distanceKm !== undefined ? (
                      <span className="text-cyan-400 font-semibold">{f.distanceKm} km away</span>
                    ) : (
                      <span>2-Hr Outlook</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Map Overlay View */}
      {viewMode === 'map' && (
        <div className="relative w-full aspect-[16/9] sm:aspect-[1.8/1] bg-slate-950 rounded-3xl border border-slate-800 p-4 overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 900 520" className="w-full h-full select-none">
            {/* Base Island outline */}
            <path
              d="M 120 280 C 140 240, 200 170, 310 140 C 420 110, 560 120, 680 180 C 780 230, 840 280, 820 340 C 800 390, 720 410, 600 420 C 500 430, 380 430, 280 410 C 190 390, 130 350, 120 280 Z"
              fill="#091322"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Plot all 47 town forecast nodes */}
            {forecasts.map((f) => {
              if (!f.coords) return null;
              const xPercent = (f.coords.longitude - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng);
              const yPercent = 1 - (f.coords.latitude - SG_BOUNDS.minLat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat);
              const x = Math.round(xPercent * 900);
              const y = Math.round(yPercent * 520);
              const style = getWeatherForecastStyle(f.forecast);
              const isSelected = activeArea?.area === f.area;

              return (
                <g
                  key={f.area}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => setSelectedArea(f)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 10 : 6}
                    fill={style.color}
                    fillOpacity={isSelected ? 0.8 : 0.4}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="9"
                    fontWeight="700"
                    className="drop-shadow pointer-events-none"
                  >
                    {f.area}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Raw Payload Inspector Toggle */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>NEA Keyless 2-Hour Weather Forecast Raw JSON</span>
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            {showRawJson ? 'Collapse JSON' : 'Inspect Raw JSON Payload'}
          </button>
        </div>

        {showRawJson && (
          <pre className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 overflow-x-auto max-h-72 leading-relaxed">
            {JSON.stringify(forecastData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
