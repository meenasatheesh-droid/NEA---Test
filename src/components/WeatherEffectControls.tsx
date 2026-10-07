import React, { useState } from 'react';
import { WeatherEffectMode } from '../types/weather';
import { weatherAudio } from '../utils/audio';
import {
  CloudRain,
  Sun,
  CloudFog,
  Zap,
  Power,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
} from 'lucide-react';

interface WeatherEffectControlsProps {
  currentMode: WeatherEffectMode;
  onSelectMode: (mode: WeatherEffectMode) => void;
  pm25Value?: number;
  rainfallMm?: number;
}

export const WeatherEffectControls: React.FC<WeatherEffectControlsProps> = ({
  currentMode,
  onSelectMode,
  pm25Value = 0,
  rainfallMm = 0,
}) => {
  const [audioActive, setAudioActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleSound = () => {
    const intensity = rainfallMm > 5 ? 0.8 : rainfallMm > 0 ? 0.4 : 0.25;
    const active = weatherAudio.toggle(intensity);
    setAudioActive(active);
  };

  const effects: Array<{
    mode: WeatherEffectMode;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { mode: 'auto', label: 'Auto (Live Data)', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
    { mode: 'rain', label: 'Downpour', icon: <CloudRain className="w-3.5 h-3.5" />, color: 'text-blue-400' },
    { mode: 'drizzle', label: 'Light Drizzle', icon: <CloudRain className="w-3.5 h-3.5 opacity-70" />, color: 'text-sky-400' },
    { mode: 'storm', label: 'Thunderstorm', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-indigo-400' },
    { mode: 'haze', label: 'Smoky Haze', icon: <CloudFog className="w-3.5 h-3.5" />, color: 'text-amber-400' },
    { mode: 'sunny', label: 'Sunny Shimmer', icon: <Sun className="w-3.5 h-3.5" />, color: 'text-yellow-400' },
    { mode: 'off', label: 'Effects Off', icon: <Power className="w-3.5 h-3.5" />, color: 'text-slate-500' },
  ];

  // What mode is auto currently evaluating to?
  const getAutoDescription = () => {
    if (rainfallMm > 10) return 'Storm active (Heavy rainfall)';
    if (rainfallMm > 2.5) return 'Rain active (Moderate rainfall)';
    if (rainfallMm > 0) return 'Drizzle active (Scattered showers)';
    if (pm25Value > 55) return `Haze active (PM2.5: ${pm25Value} µg/m³)`;
    return 'Clear sky shimmer';
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Expanded Controls Drawer / Floating Panel */}
      {isOpen && (
        <div className="mb-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-2xl w-72 sm:w-80 animate-slideUp">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Atmospheric Simulator</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentMode === 'auto' ? getAutoDescription() : `Mode: ${currentMode}`}
              </p>
            </div>

            {/* Ambient sound toggle */}
            <button
              onClick={toggleSound}
              title={audioActive ? 'Mute ambient sound' : 'Enable ambient sound'}
              className={`p-2 rounded-xl transition-all ${
                audioActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {audioActive ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {effects.map((item) => {
              const isSelected = currentMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => onSelectMode(item.mode)}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-cyan-500/50 shadow'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Toggle Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSound}
          aria-label={audioActive ? 'Mute ambient sound' : 'Play ambient weather audio'}
          className={`p-3 rounded-2xl shadow-xl backdrop-blur-md border transition-all ${
            audioActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20'
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
          }`}
        >
          {audioActive ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 shadow-xl flex items-center gap-2 text-xs font-bold transition-all hover:bg-slate-850"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <span>Weather FX: <strong className="text-white capitalize">{currentMode}</strong></span>
        </button>
      </div>
    </div>
  );
};
