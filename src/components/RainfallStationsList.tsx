import React, { useState, useMemo } from 'react';
import { StationWithRain, UserLocation } from '../types/weather';
import { getRainfallQualityBand } from '../services/neaApi';
import { Search, Droplets, MapPin, ArrowUpDown, ChevronRight } from 'lucide-react';

interface RainfallStationsListProps {
  stations: StationWithRain[];
  selectedStation: StationWithRain | null;
  onSelectStation: (station: StationWithRain) => void;
  userLocation: UserLocation | null;
}

type SortOption = 'distance' | 'rain-desc' | 'name';

export const RainfallStationsList: React.FC<RainfallStationsListProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  userLocation,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'raining' | 'dry'>('all');
  const [sortBy, setSortBy] = useState<SortOption>(userLocation ? 'distance' : 'rain-desc');

  const filteredStations = useMemo(() => {
    return stations
      .filter((station) => {
        const matchesSearch =
          station.name.toLowerCase().includes(search.toLowerCase()) ||
          station.id.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'raining') return station.value > 0;
        if (filter === 'dry') return station.value === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          const distA = a.distanceKm ?? 9999;
          const distB = b.distanceKm ?? 9999;
          return distA - distB;
        }
        if (sortBy === 'rain-desc') {
          return b.value - a.value;
        }
        return a.name.localeCompare(b.name);
      });
  }, [stations, search, filter, sortBy]);

  const rainingCount = stations.filter((s) => s.value > 0).length;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-400" />
            <span>Singapore Rainfall Stations Directory</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time 5-minute total precipitation across {stations.length} NEA monitoring stations
          </p>
        </div>

        {/* Stats summary badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-400">
            {rainingCount} stations raining now
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700/60 text-slate-300">
            {stations.length - rainingCount} dry
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station name (e.g. Marina, Changi, Jurong, Orchard)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="sm:col-span-4 flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({stations.length})
          </button>
          <button
            onClick={() => setFilter('raining')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'raining' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raining ({rainingCount})
          </button>
          <button
            onClick={() => setFilter('dry')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'dry' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dry
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="sm:col-span-2 relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-cyan-500 cursor-pointer"
          >
            {userLocation && <option value="distance">Nearest First</option>}
            <option value="rain-desc">Highest Rain</option>
            <option value="name">Station Name</option>
          </select>
        </div>
      </div>

      {/* Stations Scrollable Grid */}
      <div className="max-h-96 overflow-y-auto pr-1 space-y-2 no-scrollbar">
        {filteredStations.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
            No rainfall stations found matching "{search}".
          </div>
        ) : (
          filteredStations.map((station) => {
            const band = getRainfallQualityBand(station.value);
            const isSelected = selectedStation?.id === station.id;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-sky-400 bg-slate-800 shadow-md shadow-sky-500/10'
                    : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${band.badgeBg}`}
                  >
                    <Droplets className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {station.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {station.id}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      {station.distanceKm !== undefined ? (
                        <span className="flex items-center gap-1 text-cyan-400 font-medium">
                          <MapPin className="w-3 h-3" />
                          {station.distanceKm} km away
                        </span>
                      ) : (
                        <span>
                          Lat {station.location.latitude.toFixed(2)}, Lng{' '}
                          {station.location.longitude.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div
                      className="text-sm sm:text-base font-extrabold font-mono"
                      style={{ color: band.color }}
                    >
                      {station.value} mm
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400">
                      {band.label}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
