import React, { useState } from 'react';
import { ApiHealthResponse } from '../types/weather';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  X,
  Server,
  Clock,
  Cpu,
} from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: ApiHealthResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({
  isOpen,
  onClose,
  healthData,
  isLoading,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen) return null;

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(window.location.origin + '/api/health.js');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'up' || status === 'healthy') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (status === 'degraded') {
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
    return <XCircle className="w-5 h-5 text-rose-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>API Health & Connectivity Monitor</span>
                <span className="text-[10px] font-mono font-normal text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800">
                  /api/health.js
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Live endpoint telemetry for Singapore NEA real-time data sources
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4 no-scrollbar">
          {/* Overall Health Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(healthData?.status)}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  System Status
                </span>
                <span className="text-base font-bold text-white capitalize">
                  {healthData?.status || 'Monitoring...'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block">Total Ping Latency</span>
              <span className="text-base font-extrabold font-mono text-cyan-400">
                {healthData?.totalLatencyMs ?? '--'} ms
              </span>
            </div>
          </div>

          {/* Endpoints Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* PM2.5 API Health */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData?.services.nea_pm25.status)}
                  <span className="text-sm font-bold text-white">PM2.5 API</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HTTP {healthData?.services.nea_pm25.statusCode || 200}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-white font-mono font-bold">
                    {healthData?.services.nea_pm25.latencyMs ?? '--'} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Regions:</span>
                  <span className="text-white font-mono">
                    {healthData?.services.nea_pm25.regionsAvailable ?? 5} / 5
                  </span>
                </div>
                <div className="flex justify-between truncate">
                  <span>Last Sync:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {healthData?.services.nea_pm25.lastUpdated
                      ? new Date(healthData.services.nea_pm25.lastUpdated).toLocaleTimeString()
                      : '--'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 truncate">
                /api/pm25
              </div>
            </div>

            {/* Rainfall API Health */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData?.services.nea_rainfall.status)}
                  <span className="text-sm font-bold text-white">Rainfall API</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HTTP {healthData?.services.nea_rainfall.statusCode || 200}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-white font-mono font-bold">
                    {healthData?.services.nea_rainfall.latencyMs ?? '--'} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stations:</span>
                  <span className="text-white font-mono">
                    {healthData?.services.nea_rainfall.activeStations ?? '--'}
                  </span>
                </div>
                <div className="flex justify-between truncate">
                  <span>Last Sync:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {healthData?.services.nea_rainfall.lastUpdated
                      ? new Date(healthData.services.nea_rainfall.lastUpdated).toLocaleTimeString()
                      : '--'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 truncate">
                /api/rainfall
              </div>
            </div>

            {/* 2-Hour Forecast API Health */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData?.services.nea_two_hr_forecast?.status)}
                  <span className="text-sm font-bold text-white">2-Hr Forecast</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HTTP {healthData?.services.nea_two_hr_forecast?.statusCode || 200}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-white font-mono font-bold">
                    {healthData?.services.nea_two_hr_forecast?.latencyMs ?? '--'} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Areas:</span>
                  <span className="text-white font-mono">
                    {healthData?.services.nea_two_hr_forecast?.areasCount ?? 47} towns
                  </span>
                </div>
                <div className="flex justify-between truncate">
                  <span>Last Sync:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {healthData?.services.nea_two_hr_forecast?.lastUpdated
                      ? new Date(healthData.services.nea_two_hr_forecast.lastUpdated).toLocaleTimeString()
                      : '--'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 truncate">
                /api/two-hr-forecast
              </div>
            </div>
          </div>

          {/* Environment & Server Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              Runtime: <strong className="text-slate-300 font-mono">{healthData?.environment.nodeVersion || 'Node.js'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Server Uptime: <strong className="text-slate-300 font-mono">{healthData?.uptimeSeconds ?? 0}s</strong>
            </span>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-cyan-400 hover:underline font-semibold"
            >
              {showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}
            </button>
          </div>

          {/* Raw JSON viewer */}
          {showRawJson && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-48 leading-relaxed">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyEndpoint}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Endpoint URL Copied!' : 'Copy /api/health.js URL'}</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Ping / Re-check Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
