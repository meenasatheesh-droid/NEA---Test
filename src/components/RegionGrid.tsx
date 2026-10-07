import React from 'react';
import { SingaporeRegion } from '../types/weather';
import { getPM25QualityBand, SINGAPORE_REGIONS_COORDS } from '../services/neaApi';
import { Wind, ArrowUpRight, Compass } from 'lucide-react';

interface RegionGridProps {
  pm25Data: Record<SingaporeRegion, number> | null;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
}

export const RegionGrid: React.FC<RegionGridProps> = ({
  pm25Data,
  selectedRegion,
  onSelectRegion,
}) => {
  const regions: SingaporeRegion[] = ['north', 'south', 'east', 'west', 'central'];

  const values = regions.map((r) => pm25Data?.[r] ?? 0);
  const maxVal = Math.max(...values, 60);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Singapore Island Regional Air Quality</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare 1-hourly PM2.5 (µg/m³) across all 5 geographical zones
          </p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          Tap card to focus region
        </span>
      </div>

      {/* Grid of 5 regions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {regions.map((region) => {
          const val = pm25Data?.[region] ?? 0;
          const band = getPM25QualityBand(val);
          const isSelected = selectedRegion === region;
          const percent = Math.min(100, Math.round((val / maxVal) * 100));

          return (
            <button
              key={region}
              onClick={() => onSelectRegion(region)}
              className={`relative overflow-hidden text-left p-4.5 rounded-2xl border transition-all duration-300 group ${
                isSelected
                  ? 'border-cyan-400/80 bg-slate-800/90 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 capitalize">
                  {region}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: band.color, boxShadow: `0 0 8px ${band.color}` }}
                />
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-3xl font-extrabold font-mono tracking-tight"
                    style={{ color: band.color }}
                  >
                    {val}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">µg/m³</span>
                </div>
              </div>

              <div className="mt-2.5 text-xs font-semibold" style={{ color: band.color }}>
                {band.label}
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: band.color,
                  }}
                />
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 p-1 rounded-full bg-cyan-500/20 text-cyan-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
