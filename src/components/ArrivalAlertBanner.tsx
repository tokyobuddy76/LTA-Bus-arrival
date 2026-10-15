import React from 'react';
import { BellRing, X, ArrowRight } from 'lucide-react';

interface ArrivalAlertBannerProps {
  alerts: { serviceNo: string; stopDescription: string; minutes: number }[];
  onDismiss: (serviceNo: string) => void;
  onViewStop: () => void;
}

export const ArrivalAlertBanner: React.FC<ArrivalAlertBannerProps> = ({
  alerts,
  onDismiss,
  onViewStop,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => (
        <div
          key={alert.serviceNo}
          className="pointer-events-auto bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl shadow-black/50 text-slate-100 flex items-start justify-between gap-3 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold font-mono text-base text-amber-400">
                  Bus {alert.serviceNo}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Arriving Soon
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 font-medium">
                {alert.minutes <= 0
                  ? 'Bus is pulling up to the stop right now!'
                  : `Arriving in ~${alert.minutes} min at ${alert.stopDescription}`}
              </p>

              <button
                onClick={onViewStop}
                className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>View bus stop timings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onDismiss(alert.serviceNo)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
