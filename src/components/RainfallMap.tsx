import React, { useState } from 'react';
import { SingaporeRegion, StationWithRain, UserLocation } from '../types/weather';
import { SINGAPORE_REGIONS_COORDS, getPM25QualityBand, getRainfallQualityBand } from '../services/neaApi';
import { MapPin, Navigation, Droplets, Wind, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface RainfallMapProps {
  stations: StationWithRain[];
  pm25Data: Record<SingaporeRegion, number> | null;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
  selectedStation: StationWithRain | null;
  onSelectStation: (station: StationWithRain) => void;
  userLocation: UserLocation | null;
}

// Singapore coordinate bounds for SVG projection
const SG_BOUNDS = {
  minLat: 1.15,
  maxLat: 1.48,
  minLng: 103.6,
  maxLng: 104.05,
};

function projectCoordinates(lat: number, lng: number, width: number, height: number) {
  // SVG coordinates: (x, y) where x is longitude, y is latitude inverted
  const xPercent = (lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng);
  const yPercent = 1 - (lat - SG_BOUNDS.minLat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat);
  return {
    x: Math.round(xPercent * width),
    y: Math.round(yPercent * height),
  };
}

export const RainfallMap: React.FC<RainfallMapProps> = ({
  stations,
  pm25Data,
  selectedRegion,
  onSelectRegion,
  selectedStation,
  onSelectStation,
  userLocation,
}) => {
  const [filterRainOnly, setFilterRainOnly] = useState(false);
  const [hoveredStation, setHoveredStation] = useState<StationWithRain | null>(null);

  const mapWidth = 900;
  const mapHeight = 520;

  const displayStations = filterRainOnly ? stations.filter((s) => s.value > 0) : stations;
  const rainingCount = stations.filter((s) => s.value > 0).length;

  return (
    <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Interactive Singapore Atmospheric Map
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time PM2.5 regional zones & {stations.length} NEA rainfall stations
          </p>
        </div>

        {/* Map filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterRainOnly(!filterRainOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterRainOnly
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Raining Only ({rainingCount})</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(['north', 'south', 'east', 'west', 'central'] as SingaporeRegion[]).map((r) => {
              const pm25Val = pm25Data?.[r];
              const band = pm25Val !== undefined ? getPM25QualityBand(pm25Val) : null;
              const isSelected = selectedRegion === r;

              return (
                <button
                  key={r}
                  onClick={() => onSelectRegion(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    isSelected
                      ? 'bg-slate-700 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: band?.color || '#94a3b8' }}
                    />
                    {r}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[1.8/1] bg-slate-950/90 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full select-none"
        >
          <defs>
            {/* Glow filters */}
            <filter id="glow-rain" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Singapore Main Island Stylized Contour Base */}
          <path
            d="M 120 280 C 140 240, 200 170, 310 140 C 420 110, 560 120, 680 180 C 780 230, 840 280, 820 340 C 800 390, 720 410, 600 420 C 500 430, 380 430, 280 410 C 190 390, 130 350, 120 280 Z"
            fill="#091322"
            stroke="#1e293b"
            strokeWidth="3"
            strokeDasharray="4 4"
            className="transition-colors duration-500"
          />

          {/* Regional Approximate Boundaries & PM2.5 Regional Hubs */}
          {(Object.keys(SINGAPORE_REGIONS_COORDS) as SingaporeRegion[]).map((region) => {
            const coords = SINGAPORE_REGIONS_COORDS[region];
            const pt = projectCoordinates(coords.lat, coords.lng, mapWidth, mapHeight);
            const pm25 = pm25Data?.[region];
            const band = pm25 !== undefined ? getPM25QualityBand(pm25) : null;
            const isSelected = selectedRegion === region;

            return (
              <g
                key={region}
                className="cursor-pointer transition-transform duration-300"
                onClick={() => onSelectRegion(region)}
              >
                {/* Regional Aura */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 68 : 52}
                  fill={band ? band.color : '#38bdf8'}
                  fillOpacity={isSelected ? 0.22 : 0.08}
                  stroke={band ? band.color : '#38bdf8'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  strokeOpacity={isSelected ? 0.8 : 0.3}
                  className="transition-all duration-300 hover:fill-opacity-30"
                />

                {/* Region Label Tag */}
                <g transform={`translate(${pt.x}, ${pt.y})`}>
                  <rect
                    x="-42"
                    y="-30"
                    width="84"
                    height="24"
                    rx="12"
                    fill="#0f172a"
                    stroke={isSelected ? band?.color || '#38bdf8' : '#334155'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x="0"
                    y="-14"
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="700"
                    className="capitalize tracking-wider pointer-events-none"
                  >
                    {region}
                  </text>
                  {pm25 !== undefined && (
                    <text
                      x="0"
                      y="16"
                      textAnchor="middle"
                      fill={band?.color || '#38bdf8'}
                      fontSize="14"
                      fontWeight="800"
                      className="pointer-events-none font-mono drop-shadow"
                    >
                      {pm25} µg
                    </text>
                  )}
                </g>
              </g>
            );
          })}

          {/* User Location Marker (if available) */}
          {userLocation && (
            <g
              transform={`translate(${
                projectCoordinates(userLocation.latitude, userLocation.longitude, mapWidth, mapHeight).x
              }, ${
                projectCoordinates(userLocation.latitude, userLocation.longitude, mapWidth, mapHeight).y
              })`}
            >
              <circle r="18" fill="#06b6d4" fillOpacity="0.25" className="animate-ping" />
              <circle r="9" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
              <text
                x="0"
                y="-14"
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="10"
                fontWeight="800"
                className="bg-slate-900 drop-shadow"
              >
                YOU
              </text>
            </g>
          )}

          {/* Rainfall Stations Markers */}
          {displayStations.map((station) => {
            const pt = projectCoordinates(
              station.location.latitude,
              station.location.longitude,
              mapWidth,
              mapHeight
            );
            const isRaining = station.value > 0;
            const rainBand = getRainfallQualityBand(station.value);
            const isSelected = selectedStation?.id === station.id;
            const isHovered = hoveredStation?.id === station.id;

            const radius = isSelected ? 8 : isRaining ? (station.value > 10 ? 8 : station.value > 2 ? 6.5 : 5.5) : 3.5;

            return (
              <g
                key={station.id}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectStation(station)}
                onMouseEnter={() => setHoveredStation(station)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Station Ripple for raining stations */}
                {isRaining && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={radius * 2.2}
                    fill={rainBand.color}
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Station dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={radius}
                  fill={isRaining ? rainBand.color : '#334155'}
                  stroke={isSelected ? '#ffffff' : isRaining ? '#bae6fd' : '#1e293b'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  filter={isRaining ? 'url(#glow-rain)' : undefined}
                  className="transition-all hover:scale-150"
                />

                {/* Rain reading tag for active raining stations */}
                {isRaining && (
                  <text
                    x={pt.x}
                    y={pt.y - radius - 3}
                    textAnchor="middle"
                    fill={rainBand.color}
                    fontSize="9"
                    fontWeight="700"
                    className="font-mono pointer-events-none drop-shadow"
                  >
                    {station.value}mm
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip for Hovered / Selected Station */}
        {(hoveredStation || selectedStation) && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 max-w-sm pointer-events-none">
            {(() => {
              const active = hoveredStation || selectedStation!;
              const rainBand = getRainfallQualityBand(active.value);
              return (
                <>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">{active.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>ID: {active.id}</span>
                      {active.distanceKm !== undefined && (
                        <span>• {active.distanceKm} km from you</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold font-mono" style={{ color: rainBand.color }}>
                      {active.value} mm
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {rainBand.label}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-300">Rainfall:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Dry (0mm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Light (&lt;2.5mm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Moderate (2.5-10mm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Heavy (&gt;10mm)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Tap regions or stations to inspect</span>
        </div>
      </div>
    </div>
  );
};
