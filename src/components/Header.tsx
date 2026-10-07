import React from 'react';
import { ApiHealthResponse, UserLocation } from '../types/weather';
import { Activity, ShieldCheck, Clock, MapPin, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenHealth: () => void;
  healthData: ApiHealthResponse | null;
  userLocation: UserLocation | null;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHealth,
  healthData,
  userLocation,
  onRefreshAll,
  isRefreshing,
}) => {
  const isHealthy = healthData?.status === 'healthy';
  const isDegraded = healthData?.status === 'degraded';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-sky-200 font-extrabold text-sm tracking-tighter">
                SG
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                SG Air & Rain
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                NEA Keyless API
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Singapore Real-Time PM2.5 & Rainfall Environmental Monitor
            </p>
          </div>
        </div>

        {/* Right Status Badges & Health Modal Button */}
        <div className="flex items-center gap-2.5">
          {/* API Health Monitor Button */}
          <button
            onClick={onOpenHealth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 transition-all hover:border-slate-700 shadow-sm"
            title="Inspect /api/health.js"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : isDegraded
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">API Health:</span>
            <span className="font-mono text-cyan-300">
              {healthData?.totalLatencyMs ? `${healthData.totalLatencyMs}ms` : '/api/health.js'}
            </span>
          </button>

          {/* Quick Refresh */}
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Refresh NEA data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
