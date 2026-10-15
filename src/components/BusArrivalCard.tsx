import React from 'react';
import { BusServiceArrival, BusStop } from '../types/bus';
import { formatArrivalTime } from '../services/ltaApi';
import { OPERATOR_METADATA } from '../data/singaporeBuses';
import { CrowdBadge } from './CrowdBadge';
import {
  Bell,
  BellRing,
  Bookmark,
  MapPin,
  Route,
  Navigation,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface BusArrivalCardProps {
  service: BusServiceArrival;
  currentStop: BusStop;
  isFavorite: boolean;
  onToggleFavorite: (serviceNo: string) => void;
  onInspectRoute: (serviceNo: string) => void;
  onTrackOnMap: (serviceNo: string, busLat?: string, busLng?: string) => void;
  isAlarmSet: boolean;
  onToggleAlarm: (serviceNo: string) => void;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  service,
  currentStop,
  isFavorite,
  onToggleFavorite,
  onInspectRoute,
  onTrackOnMap,
  isAlarmSet,
  onToggleAlarm,
}) => {
  const operator = OPERATOR_METADATA[service.Operator] || OPERATOR_METADATA.SBST;

  const next1 = formatArrivalTime(service.NextBus?.EstimatedArrival);
  const next2 = formatArrivalTime(service.NextBus2?.EstimatedArrival);
  const next3 = formatArrivalTime(service.NextBus3?.EstimatedArrival);

  // Approximate distance if GPS is available
  const hasGps =
    service.NextBus?.Latitude &&
    service.NextBus.Latitude !== '0.0' &&
    parseFloat(service.NextBus.Latitude) > 0;

  return (
    <div className="group relative bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl p-4 transition-all duration-200 shadow-lg shadow-black/20">
      {/* Top Header: Service No, Operator, and Quick Action Icons */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Service Number Badge */}
          <div className="relative">
            <span className="flex items-center justify-center min-w-[62px] px-2.5 py-1.5 rounded-lg bg-slate-900 border-2 border-slate-700 font-extrabold text-2xl tracking-tight text-white shadow-inner font-mono">
              {service.ServiceNo}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${operator.badgeClass}`}
              >
                {operator.name}
              </span>
              {hasGps && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live GPS
                </span>
              )}
            </div>
            {service.NextBus?.SpeedKmH && service.NextBus.SpeedKmH > 0 && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Gauge className="w-3 h-3 text-slate-500" />
                <span>Speed: ~{service.NextBus.SpeedKmH} km/h</span>
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleAlarm(service.ServiceNo)}
            title={isAlarmSet ? 'Cancel Arrival Alarm' : 'Set Alarm for this bus'}
            className={`p-2 rounded-lg transition-colors ${
              isAlarmSet
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            {isAlarmSet ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onToggleFavorite(service.ServiceNo)}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorite buses'}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Arrival Countdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3 bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
        {/* Next Bus (Primary) */}
        <div className="flex sm:flex-col justify-between items-center sm:items-start p-2 rounded-md bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Next Bus
            </span>
            {next1.isArr && (
              <span className="hidden sm:inline-flex px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded animate-pulse">
                ARRIVING
              </span>
            )}
          </div>

          <div className="my-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                next1.isArr
                  ? 'text-emerald-400 animate-pulse'
                  : next1.isImminent
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {next1.displayText}
            </span>
          </div>

          <CrowdBadge
            load={service.NextBus?.Load}
            type={service.NextBus?.Type}
            isWab={service.NextBus?.Feature === 'WAB'}
            compact
          />
        </div>

        {/* 2nd Bus */}
        <div className="flex sm:flex-col justify-between items-center sm:items-start p-2 rounded-md bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            2nd Bus
          </span>
          <div className="my-1">
            <span className="text-xl font-bold font-mono tracking-tight text-slate-200">
              {next2.displayText}
            </span>
          </div>
          {service.NextBus2?.EstimatedArrival ? (
            <CrowdBadge
              load={service.NextBus2.Load}
              type={service.NextBus2.Type}
              isWab={service.NextBus2.Feature === 'WAB'}
              compact
            />
          ) : (
            <span className="text-[11px] text-slate-500">No scheduled data</span>
          )}
        </div>

        {/* 3rd Bus */}
        <div className="flex sm:flex-col justify-between items-center sm:items-start p-2 rounded-md bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            3rd Bus
          </span>
          <div className="my-1">
            <span className="text-xl font-bold font-mono tracking-tight text-slate-300">
              {next3.displayText}
            </span>
          </div>
          {service.NextBus3?.EstimatedArrival ? (
            <CrowdBadge
              load={service.NextBus3.Load}
              type={service.NextBus3.Type}
              isWab={service.NextBus3.Feature === 'WAB'}
              compact
            />
          ) : (
            <span className="text-[11px] text-slate-500">No scheduled data</span>
          )}
        </div>
      </div>

      {/* Action Footer: Track on Map & Route Itinerary */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50 text-xs">
        <button
          onClick={() => onInspectRoute(service.ServiceNo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
        >
          <Route className="w-3.5 h-3.5 text-emerald-400" />
          <span>Route & Stops</span>
        </button>

        <button
          onClick={() =>
            onTrackOnMap(
              service.ServiceNo,
              service.NextBus?.Latitude,
              service.NextBus?.Longitude
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live GPS Track</span>
        </button>
      </div>
    </div>
  );
};
