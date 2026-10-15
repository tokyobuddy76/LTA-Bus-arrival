import React from 'react';
import { SINGAPORE_BUS_SERVICES, OPERATOR_METADATA } from '../data/singaporeBuses';
import { LiveBusTracking, BusStop } from '../types/bus';
import {
  X,
  Route,
  Clock,
  ArrowRight,
  Bus,
  MapPin,
  CheckCircle,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface RouteInspectorModalProps {
  serviceNo: string | null;
  onClose: () => void;
  currentStopCode: string;
  onSelectStopCode: (stopCode: string) => void;
  activeBuses: LiveBusTracking[];
}

export const RouteInspectorModal: React.FC<RouteInspectorModalProps> = ({
  serviceNo,
  onClose,
  currentStopCode,
  onSelectStopCode,
  activeBuses,
}) => {
  if (!serviceNo || !SINGAPORE_BUS_SERVICES[serviceNo]) return null;

  const service = SINGAPORE_BUS_SERVICES[serviceNo];
  const operator = OPERATOR_METADATA[service.Operator] || OPERATOR_METADATA.SBST;
  const busesOnRoute = activeBuses.filter((b) => b.serviceNo === serviceNo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border-2 border-slate-700 text-2xl font-black font-mono text-white">
              {service.ServiceNo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase ${operator.badgeClass}`}
                >
                  {operator.name}
                </span>
                {service.LoopDesc && (
                  <span className="text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                    Loop Service
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direction {service.Direction} Route Itinerary
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

        {/* Route Operating Info */}
        <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-medium">
              First Bus
            </span>
            <span className="font-mono font-bold text-slate-200">
              {service.FirstBusWeekday}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-medium">
              Last Bus
            </span>
            <span className="font-mono font-bold text-slate-200">
              {service.LastBusWeekday}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-medium">
              Peak Freq
            </span>
            <span className="font-semibold text-emerald-400">
              {service.FrequencyPeakMins}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-medium">
              Active Fleet
            </span>
            <span className="font-semibold text-sky-400 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {busesOnRoute.length} buses live
            </span>
          </div>
        </div>

        {/* Timeline of Stops */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
            {service.Route.map((stop, index) => {
              const isCurrent = stop.BusStopCode === currentStopCode;
              const busesApproaching = busesOnRoute.filter(
                (b) => b.targetStopCode === stop.BusStopCode
              );

              return (
                <div key={stop.BusStopCode} className="relative group">
                  {/* Dot on line */}
                  <div
                    className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                      isCurrent
                        ? 'bg-emerald-400 border-emerald-300 ring-4 ring-emerald-500/30 scale-125'
                        : 'bg-slate-900 border-slate-500 group-hover:border-emerald-400'
                    }`}
                  />

                  {/* Stop item box */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                            {stop.BusStopCode}
                          </span>
                          <span className="text-xs text-slate-400">{stop.RoadName}</span>
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                              Origin
                            </span>
                          )}
                          {index === service.Route.length - 1 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              Terminus
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-sm text-slate-100">
                          {stop.Description}
                        </h4>

                        <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                          Seq #{stop.StopSequence} &bull; {stop.DistanceKm.toFixed(1)} km from origin
                        </span>
                      </div>

                      {/* Select this stop button */}
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onSelectStopCode(stop.BusStopCode);
                            onClose();
                          }}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-white text-xs text-slate-300 font-medium transition-colors flex items-center gap-1"
                        >
                          <span>Switch Stop</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {isCurrent && (
                        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Current Stop</span>
                        </span>
                      )}
                    </div>

                    {/* Active bus approaching indicator */}
                    {busesApproaching.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <Bus className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-mono font-semibold text-amber-300">
                          Bus #{service.ServiceNo} arriving in ~
                          {Math.max(1, Math.ceil(busesApproaching[0].nextArrivalEtaSeconds / 60))} mins
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            Close Itinerary
          </button>
        </div>
      </div>
    </div>
  );
};
