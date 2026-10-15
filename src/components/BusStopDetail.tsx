import React, { useState } from 'react';
import { BusServiceArrival, BusStop } from '../types/bus';
import { BusArrivalCard } from './BusArrivalCard';
import { MRT_LINE_META } from '../data/singaporeBuses';
import {
  Bookmark,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  MapPin,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface BusStopDetailProps {
  stop: BusStop;
  services: BusServiceArrival[];
  isLoading: boolean;
  lastUpdated: string;
  onRefresh: () => void;
  autoRefreshInterval: number;
  onToggleAutoRefresh: () => void;
  countdownSeconds: number;
  isFavoriteStop: boolean;
  onToggleFavoriteStop: (stopCode: string) => void;
  favoriteServices: string[];
  onToggleFavoriteService: (serviceNo: string) => void;
  onInspectRoute: (serviceNo: string) => void;
  onTrackOnMap: (serviceNo: string, lat?: string, lng?: string) => void;
  activeAlarms: string[];
  onToggleAlarm: (serviceNo: string) => void;
}

export const BusStopDetail: React.FC<BusStopDetailProps> = ({
  stop,
  services,
  isLoading,
  lastUpdated,
  onRefresh,
  autoRefreshInterval,
  onToggleAutoRefresh,
  countdownSeconds,
  isFavoriteStop,
  onToggleFavoriteStop,
  favoriteServices,
  onToggleFavoriteService,
  onInspectRoute,
  onTrackOnMap,
  activeAlarms,
  onToggleAlarm,
}) => {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const displayedServices = showOnlyFavorites
    ? services.filter((s) => favoriteServices.includes(s.ServiceNo))
    : services;

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';

  // SVG circular countdown calculation
  const circleRadius = 14;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = autoRefreshInterval > 0 ? countdownSeconds / autoRefreshInterval : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Bus Stop Header Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            {/* Stop Code & Road */}
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-extrabold text-sm tracking-wider">
                {stop.BusStopCode}
              </span>
              <span className="text-sm font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {stop.RoadName}
              </span>
              {stop.Region && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {stop.Region} Region
                </span>
              )}
            </div>

            {/* Stop Name / Description */}
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {stop.Description}
            </h1>

            {/* MRT Interchange Badges */}
            {stop.MrtLines && stop.MrtLines.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">MRT Connections:</span>
                {stop.MrtLines.map((line) => {
                  const meta = MRT_LINE_META[line];
                  return (
                    <span
                      key={line}
                      className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm ${
                        meta?.bg || 'bg-slate-700'
                      } ${meta?.text || 'text-white'}`}
                    >
                      {line}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Auto Refresh Toggle with SVG Ring */}
            <button
              onClick={onToggleAutoRefresh}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                autoRefreshInterval > 0
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-500/50'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
              }`}
              title={
                autoRefreshInterval > 0
                  ? `Auto-refreshing every ${autoRefreshInterval}s. Click to pause.`
                  : 'Auto-refresh paused. Click to enable 15s updates.'
              }
            >
              {autoRefreshInterval > 0 ? (
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <svg className="w-7 h-7 -rotate-90">
                    <circle
                      cx="14"
                      cy="14"
                      r={circleRadius}
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-slate-700"
                      fill="transparent"
                    />
                    <circle
                      cx="14"
                      cy="14"
                      r={circleRadius}
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-emerald-400 transition-all duration-300"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono text-[10px] font-bold text-emerald-400">
                    {countdownSeconds}
                  </span>
                </div>
              ) : (
                <Clock className="w-4 h-4 text-slate-500" />
              )}
              <span className="hidden sm:inline">
                {autoRefreshInterval > 0 ? `${autoRefreshInterval}s auto` : 'Paused'}
              </span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
              title="Refresh timings immediately"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Bookmark Stop Button */}
            <button
              onClick={() => onToggleFavoriteStop(stop.BusStopCode)}
              className={`p-2.5 rounded-xl border transition-all ${
                isFavoriteStop
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isFavoriteStop ? 'Remove stop from saved' : 'Save stop to favorites'}
            >
              <Bookmark className={`w-4 h-4 ${isFavoriteStop ? 'fill-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status subline */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-3 border-t border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Updated at <span className="font-mono text-slate-200 font-semibold">{formattedTime} SGT</span>
            </span>
          </div>

          <span className="text-slate-400">
            {services.length} active {services.length === 1 ? 'service' : 'services'} available
          </span>
        </div>
      </div>

      {/* Filter bar for services */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyFavorites(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !showOnlyFavorites
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Buses ({services.length})
          </button>

          {favoriteServices.length > 0 && (
            <button
              onClick={() => setShowOnlyFavorites(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showOnlyFavorites
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Bookmarked ({favoriteServices.length})</span>
            </button>
          )}
        </div>

        {/* Legend Quick Reference */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800">
          <span className="text-slate-500">LTA Crowding:</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Seats
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Standing
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Limited
          </span>
        </div>
      </div>

      {/* Arrival Cards List */}
      <div className="space-y-3">
        {displayedServices.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <p className="text-sm font-medium">No services match your active filters</p>
            {showOnlyFavorites && (
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="mt-2 text-xs text-emerald-400 hover:underline"
              >
                Show all available bus services
              </button>
            )}
          </div>
        ) : (
          displayedServices.map((service) => (
            <BusArrivalCard
              key={service.ServiceNo}
              service={service}
              currentStop={stop}
              isFavorite={favoriteServices.includes(service.ServiceNo)}
              onToggleFavorite={onToggleFavoriteService}
              onInspectRoute={onInspectRoute}
              onTrackOnMap={onTrackOnMap}
              isAlarmSet={activeAlarms.includes(service.ServiceNo)}
              onToggleAlarm={onToggleAlarm}
            />
          ))
        )}
      </div>

      {/* Datamall API Reference Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Accurate LTA DataMall v2 Predictive Arrival Standards</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Arrival timings indicate countdown until bus arrives at this stop. Predictions factor in real-time GPS coordinates, vehicle transit telemetry, traffic congestion, and bus passenger loading (<span className="text-emerald-400">Seats Available</span>, <span className="text-amber-400">Standing</span>, <span className="text-rose-400">Limited Standing</span>).
        </p>
      </div>
    </div>
  );
};
