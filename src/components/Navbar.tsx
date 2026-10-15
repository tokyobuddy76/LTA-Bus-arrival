import React, { useState, useEffect } from 'react';
import {
  Bus,
  Map,
  List,
  Bookmark,
  Server,
  Compass,
  Clock,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { BackendConfig } from '../types/bus';

interface NavbarProps {
  currentTab: 'arrivals' | 'map' | 'favorites';
  onChangeTab: (tab: 'arrivals' | 'map' | 'favorites') => void;
  backendConfig: BackendConfig;
  onOpenBackendModal: () => void;
  favoriteStopsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  backendConfig,
  onOpenBackendModal,
  favoriteStopsCount,
}) => {
  const [sgTime, setSgTime] = useState('');

  // Live Singapore SGT clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Singapore time
      const timeStr = now.toLocaleTimeString('en-SG', {
        timeZone: 'Asia/Singapore',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setSgTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Singapore Transit Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Bus className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                SG Bus Arrival
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                LTA DataMall
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              Singapore Real-Time Bus & Route Tracker
            </p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeTab('arrivals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'arrivals'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-4 h-4 text-emerald-400" />
            <span>Arrivals</span>
          </button>

          <button
            onClick={() => onChangeTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'map'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-4 h-4 text-sky-400" />
            <span>Live Map</span>
          </button>

          <button
            onClick={() => onChangeTab('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'favorites'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400 fill-current" />
            <span className="hidden sm:inline">Favorites</span>
            {favoriteStopsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-slate-200 font-bold font-mono">
                {favoriteStopsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Tools: Singapore Clock & Backend Connection */}
        <div className="flex items-center gap-3">
          {/* Live Singapore Time */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-300 font-semibold">{sgTime} SGT</span>
          </div>

          {/* Backend Connector Button */}
          <button
            onClick={onOpenBackendModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              backendConfig.mode === 'custom_api'
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
            title="Configure Backend Connection / LTA API"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {backendConfig.mode === 'custom_api' ? 'Custom API' : 'Backend Ready'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
