import React, { useState, useMemo } from 'react';
import { BusStop } from '../types/bus';
import {
  BUS_STOP_SERVICES_MAP,
  MRT_LINE_META,
  SINGAPORE_BUS_STOPS,
} from '../data/singaporeBuses';
import { calculateDistanceKm } from '../services/ltaApi';
import {
  Search,
  Bookmark,
  MapPin,
  Train,
  SlidersHorizontal,
  X,
  Compass,
} from 'lucide-react';

interface BusStopListProps {
  selectedStopCode: string;
  onSelectStop: (stop: BusStop) => void;
  userLocation: { lat: number; lng: number } | null;
  favoriteStops: string[];
  onToggleFavoriteStop: (stopCode: string) => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

type FilterTab = 'all' | 'nearby' | 'favorites' | 'mrt';

export const BusStopList: React.FC<BusStopListProps> = ({
  selectedStopCode,
  onSelectStop,
  userLocation,
  favoriteStops,
  onToggleFavoriteStop,
  onUseCurrentLocation,
  isLocating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Filter & sort bus stops
  const filteredStops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return SINGAPORE_BUS_STOPS.map((stop) => {
      const distanceKm = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, stop.Latitude, stop.Longitude)
        : null;

      const services = BUS_STOP_SERVICES_MAP[stop.BusStopCode] || [];

      // Check search match
      const matchesSearch =
        !q ||
        stop.BusStopCode.toLowerCase().includes(q) ||
        stop.Description.toLowerCase().includes(q) ||
        stop.RoadName.toLowerCase().includes(q) ||
        services.some((s) => s.toLowerCase() === q || s.toLowerCase().includes(q));

      // Check tab filter
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'nearby'
          ? distanceKm !== null && distanceKm <= 3.5
          : activeTab === 'favorites'
          ? favoriteStops.includes(stop.BusStopCode)
          : activeTab === 'mrt'
          ? Boolean(stop.MrtLines && stop.MrtLines.length > 0)
          : true;

      // Check region
      const matchesRegion =
        regionFilter === 'all' || stop.Region === regionFilter;

      return {
        stop,
        distanceKm,
        services,
        visible: matchesSearch && matchesTab && matchesRegion,
      };
    })
      .filter((item) => item.visible)
      .sort((a, b) => {
        // If sorting by nearby tab or distance is available
        if (activeTab === 'nearby' && a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        if (activeTab === 'favorites') {
          return 0;
        }
        return a.stop.Description.localeCompare(b.stop.Description);
      });
  }, [searchQuery, activeTab, regionFilter, userLocation, favoriteStops]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stop code, road, or bus (e.g. 08057, Orchard, 190)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Stops ({SINGAPORE_BUS_STOPS.length})
          </button>

          <button
            onClick={() => setActiveTab('nearby')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'nearby'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Nearby</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'favorites'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Saved ({favoriteStops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mrt')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'mrt'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>MRT Hubs</span>
          </button>
        </div>

        {/* Location & Region Sub-bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Regions</option>
            <option value="Central">Central / Downtown</option>
            <option value="East">East (Tampines, Bedok)</option>
            <option value="West">West (Jurong, Clementi)</option>
            <option value="North">North (Woodlands, Yishun)</option>
            <option value="North-East">North-East (Serangoon, Sengkang)</option>
          </select>

          <button
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            <MapPin className={`w-3.5 h-3.5 text-emerald-400 ${isLocating ? 'animate-bounce' : ''}`} />
            <span>{isLocating ? 'Detecting...' : 'My Location'}</span>
          </button>
        </div>
      </div>

      {/* Stop Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
        {filteredStops.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm font-medium">No bus stops found matching criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching by a different road name or stop code
            </p>
          </div>
        ) : (
          filteredStops.map(({ stop, distanceKm, services }) => {
            const isSelected = stop.BusStopCode === selectedStopCode;
            const isFav = favoriteStops.includes(stop.BusStopCode);

            return (
              <div
                key={stop.BusStopCode}
                onClick={() => onSelectStop(stop)}
                className={`group cursor-pointer p-3 rounded-xl transition-all duration-150 relative ${
                  isSelected
                    ? 'bg-slate-800/95 border-2 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Bus Stop Code & Road */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-400">
                        {stop.BusStopCode}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{stop.RoadName}</span>
                    </div>

                    {/* Description Name */}
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                      {stop.Description}
                    </h3>

                    {/* MRT Line badges if any */}
                    {stop.MrtLines && stop.MrtLines.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {stop.MrtLines.map((line) => {
                          const meta = MRT_LINE_META[line];
                          return (
                            <span
                              key={line}
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                meta?.bg || 'bg-slate-700'
                              } ${meta?.text || 'text-white'}`}
                            >
                              {line}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Services Chips */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">
                        Buses:
                      </span>
                      {services.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                      {services.length > 6 && (
                        <span className="text-[10px] text-slate-500">
                          +{services.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Distance & Bookmark */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteStop(stop.BusStopCode);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-emerald-400' : ''}`} />
                    </button>

                    {distanceKm !== null && (
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                        {distanceKm < 1
                          ? `${Math.round(distanceKm * 1000)}m`
                          : `${distanceKm.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
