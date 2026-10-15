import React from 'react';
import { BusCrowdLoad, BusVehicleType } from '../types/bus';
import { Users, Accessibility } from 'lucide-react';

interface CrowdBadgeProps {
  load?: BusCrowdLoad;
  type?: BusVehicleType;
  isWab?: boolean;
  compact?: boolean;
}

export const CrowdBadge: React.FC<CrowdBadgeProps> = ({
  load = 'SEA',
  type = 'SD',
  isWab = true,
  compact = false,
}) => {
  // LTA Crowd Load styling
  const loadConfig: Record<BusCrowdLoad, { label: string; short: string; bg: string; dot: string }> = {
    SEA: {
      label: 'Seats Available',
      short: 'Seats',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      dot: 'bg-emerald-500',
    },
    SDA: {
      label: 'Standing Available',
      short: 'Standing',
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      dot: 'bg-amber-500',
    },
    LSD: {
      label: 'Limited Standing',
      short: 'Crowded',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      dot: 'bg-rose-500',
    },
  };

  const typeConfig: Record<BusVehicleType, { label: string; icon: string }> = {
    SD: { label: 'Single Deck', icon: 'SD' },
    DD: { label: 'Double Deck', icon: 'DD' },
    BD: { label: 'Bendy Bus', icon: 'BD' },
  };

  const currentLoad = loadConfig[load] || loadConfig.SEA;
  const currentType = typeConfig[type] || typeConfig.SD;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        <span
          title={currentLoad.label}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium ${currentLoad.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentLoad.dot}`} />
          {currentLoad.short}
        </span>
        <span
          title={currentType.label}
          className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]"
        >
          {currentType.icon}
        </span>
        {isWab && (
          <span title="Wheelchair Accessible (WAB)" className="text-sky-400">
            <Accessibility className="w-3 h-3" />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Load badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${currentLoad.bg}`}
        title={`Crowd Level: ${currentLoad.label}`}
      >
        <span className={`w-2 h-2 rounded-full ${currentLoad.dot} animate-pulse`} />
        <span>{currentLoad.label}</span>
      </div>

      {/* Vehicle Type badge */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono"
        title={`Vehicle: ${currentType.label}`}
      >
        <span>{currentType.icon}</span>
        <span className="text-[10px] text-slate-400">({currentType.label})</span>
      </div>

      {/* WAB badge */}
      {isWab && (
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-800/50 text-xs text-sky-300"
          title="Wheelchair Accessible Bus"
        >
          <Accessibility className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">WAB</span>
        </div>
      )}
    </div>
  );
};
