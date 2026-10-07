import React, { useState } from 'react';
import { SingaporeRegion, PM25ApiResponse } from '../types/weather';
import { getPM25QualityBand, SINGAPORE_REGIONS_COORDS } from '../services/neaApi';
import {
  Wind,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Compass,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  Code,
} from 'lucide-react';

interface PM25DetailViewProps {
  pm25Data: PM25ApiResponse | null;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const PM25DetailView: React.FC<PM25DetailViewProps> = ({
  pm25Data,
  selectedRegion,
  onSelectRegion,
  onRefresh,
  isRefreshing,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const endpointUrl = 'https://api-open.data.gov.sg/v2/real-time/api/pm25';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const item = pm25Data?.data?.items?.[0];
  const readings = item?.readings?.pm25_one_hourly || null;
  const regionMetadata = pm25Data?.data?.regionMetadata || [];

  const regions: SingaporeRegion[] = ['north', 'south', 'east', 'west', 'central'];

  // Calculate island summary stats
  const values = readings ? regions.map((r) => readings[r] ?? 0) : [];
  const averagePM25 = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const maxPM25 = values.length ? Math.max(...values) : 0;
  const minPM25 = values.length ? Math.min(...values) : 0;

  const highestRegion = regions.find((r) => readings?.[r] === maxPM25) || 'central';
  const lowestRegion = regions.find((r) => readings?.[r] === minPM25) || 'central';

  const selectedValue = readings?.[selectedRegion] ?? 0;
  const selectedBand = getPM25QualityBand(selectedValue);

  return (
    <div className="space-y-6">
      {/* Top Source & Status Header */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                NEA Official Feed Connected
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Singapore Real-Time PM2.5 Data Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Source: <code className="text-cyan-400 font-mono">https://api-open.data.gov.sg/v2/real-time/api/pm25</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Endpoint Copied' : 'Copy API URL'}</span>
            </button>

            <a
              href={endpointUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Open Raw API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 4 Island-Wide Summary KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          {/* Average */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Island Average
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold font-mono text-cyan-400">
                {averagePM25}
              </span>
              <span className="text-xs text-slate-500">µg/m³</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Across all 5 regions
            </span>
          </div>

          {/* Highest Region */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Highest Zone
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold font-mono text-rose-400">
                {maxPM25}
              </span>
              <span className="text-xs text-slate-500">µg/m³</span>
            </div>
            <span className="text-[11px] font-bold text-slate-300 capitalize mt-1 block">
              {highestRegion} Region
            </span>
          </div>

          {/* Lowest Region */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Lowest Zone
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold font-mono text-emerald-400">
                {minPM25}
              </span>
              <span className="text-xs text-slate-500">µg/m³</span>
            </div>
            <span className="text-[11px] font-bold text-slate-300 capitalize mt-1 block">
              {lowestRegion} Region
            </span>
          </div>

          {/* Last Sync Time */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Updated Timestamp
            </span>
            <div className="text-sm font-extrabold font-mono text-slate-200 mt-1 truncate">
              {item?.updatedTimestamp
                ? new Date(item.updatedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Live'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Date: {item?.date || 'Today'}
            </span>
          </div>
        </div>
      </div>

      {/* Regional PM2.5 Detailed Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {regions.map((region) => {
          const val = readings?.[region] ?? 0;
          const band = getPM25QualityBand(val);
          const isSelected = selectedRegion === region;
          const meta = regionMetadata.find((m) => m.name === region);

          return (
            <div
              key={region}
              onClick={() => onSelectRegion(region)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400/90 bg-slate-900 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: band.color, boxShadow: `0 0 8px ${band.color}` }}
                    />
                    <h3 className="text-sm font-extrabold text-white capitalize">{region}</h3>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                    style={{ color: band.color }}
                  >
                    {val}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">µg/m³</span>
                </div>

                <div
                  className="mt-2 text-xs font-bold px-2.5 py-1 rounded-xl inline-block"
                  style={{
                    backgroundColor: `${band.color}18`,
                    color: band.color,
                  }}
                >
                  {band.label}
                </div>
              </div>

              {/* Coordinates from regionMetadata */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>GPS Center:</span>
                  <span className="font-mono text-slate-300">
                    {meta
                      ? `${meta.labelLocation.latitude.toFixed(2)}, ${meta.labelLocation.longitude.toFixed(2)}`
                      : `${SINGAPORE_REGIONS_COORDS[region].lat}, ${SINGAPORE_REGIONS_COORDS[region].lng}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Benchmark:</span>
                  <span className="text-slate-300 font-mono">{band.range}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Region Focus Advisory Panel */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border bg-gradient-to-br ${selectedBand.bgGradient} ${selectedBand.borderColor} shadow-xl`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <Wind className="w-6 h-6" style={{ color: selectedBand.color }} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selected Focus Region
              </span>
              <h3 className="text-xl font-black text-white capitalize">
                {selectedRegion} Singapore • {selectedValue} µg/m³
              </h3>
            </div>
          </div>

          <div
            className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold border self-start sm:self-auto"
            style={{
              backgroundColor: `${selectedBand.color}25`,
              borderColor: `${selectedBand.color}60`,
              color: selectedBand.color,
            }}
          >
            Status: {selectedBand.label} ({selectedBand.range})
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              General Public Advisory
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {selectedBand.generalPublic}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Vulnerable Groups Advisory
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {selectedBand.vulnerableGroups}
            </p>
          </div>
        </div>
      </div>

      {/* Raw Payload Inspector Toggle */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>NEA Keyless PM2.5 Raw JSON Response</span>
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            {showRawJson ? 'Collapse JSON' : 'Inspect Raw JSON Payload'}
          </button>
        </div>

        {showRawJson && (
          <pre className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed">
            {JSON.stringify(pm25Data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
