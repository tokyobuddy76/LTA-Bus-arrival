/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BackendConfig,
  BusServiceArrival,
  BusStop,
  LiveBusTracking,
} from './types/bus';
import {
  SINGAPORE_BUS_STOPS,
  SINGAPORE_BUS_SERVICES,
} from './data/singaporeBuses';
import {
  getBusArrivals,
  getActiveBusesTelemetry,
  formatArrivalTime,
} from './services/ltaApi';
import { Navbar } from './components/Navbar';
import { BusStopList } from './components/BusStopList';
import { BusStopDetail } from './components/BusStopDetail';
import { LiveBusMap } from './components/LiveBusMap';
import { RouteInspectorModal } from './components/RouteInspectorModal';
import { BackendConnectorModal } from './components/BackendConnectorModal';
import { ArrivalAlertBanner } from './components/ArrivalAlertBanner';
import { playArrivalChime } from './utils/soundAlert';

export default function App() {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'arrivals' | 'map' | 'favorites'>('arrivals');

  // Selected Bus Stop (defaults to Orchard Stn / Tang Plaza - 08057)
  const [selectedStop, setSelectedStop] = useState<BusStop>(SINGAPORE_BUS_STOPS[0]);

  // Bus Arrival Timings for selected stop
  const [arrivals, setArrivals] = useState<BusServiceArrival[]>([]);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Active Buses GPS Telemetry for live map
  const [activeBuses, setActiveBuses] = useState<LiveBusTracking[]>([]);

  // Route Inspector Modal & Live Tracking
  const [inspectingRouteServiceNo, setInspectingRouteServiceNo] = useState<string | null>(null);
  const [trackedServiceNo, setTrackedServiceNo] = useState<string | null>(null);

  // Auto-refresh countdown (default 15 seconds)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(15);

  // User simulated / browser location (defaults to Orchard Rd, Singapore)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 1.3048,
    lng: 103.8329,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Favorites (persisted in localStorage)
  const [favoriteStops, setFavoriteStops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_favorite_stops');
      return saved ? JSON.parse(saved) : ['08057', '03509'];
    } catch {
      return ['08057', '03509'];
    }
  });

  const [favoriteServices, setFavoriteServices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_favorite_services');
      return saved ? JSON.parse(saved) : ['190', '65'];
    } catch {
      return ['190', '65'];
    }
  });

  // Alarms & Notifications
  const [activeAlarms, setActiveAlarms] = useState<string[]>([]);
  const [alarmAlerts, setAlarmAlerts] = useState<
    { serviceNo: string; stopDescription: string; minutes: number }[]
  >([]);

  // Backend Connector Config
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_backend_config');
      return saved
        ? JSON.parse(saved)
        : {
            mode: 'simulated',
            apiUrl: 'http://localhost:5000/api/bus-arrival',
            apiKey: '',
            refreshInterval: 15,
          };
    } catch {
      return {
        mode: 'simulated',
        apiUrl: 'http://localhost:5000/api/bus-arrival',
        apiKey: '',
        refreshInterval: 15,
      };
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sg_bus_favorite_stops', JSON.stringify(favoriteStops));
    } catch (e) {
      console.error(e);
    }
  }, [favoriteStops]);

  useEffect(() => {
    try {
      localStorage.setItem('sg_bus_favorite_services', JSON.stringify(favoriteServices));
    } catch (e) {
      console.error(e);
    }
  }, [favoriteServices]);

  // Load Bus Arrivals
  const fetchArrivals = useCallback(async () => {
    setIsLoadingArrivals(true);
    try {
      const res = await getBusArrivals(
        selectedStop.BusStopCode,
        backendConfig.mode === 'custom_api' ? backendConfig.apiUrl : undefined,
        backendConfig.apiKey
      );

      setArrivals(res.services);
      setLastUpdated(res.timestamp);

      // Refresh active live buses telemetry
      const buses = getActiveBusesTelemetry();
      setActiveBuses(buses);

      // Check active alarms for arrival threshold (<= 2 minutes)
      if (activeAlarms.length > 0) {
        res.services.forEach((service) => {
          if (activeAlarms.includes(service.ServiceNo)) {
            const time = formatArrivalTime(service.NextBus?.EstimatedArrival);
            if (time.minutes >= 0 && time.minutes <= 2) {
              setAlarmAlerts((prev) => {
                if (prev.some((a) => a.serviceNo === service.ServiceNo)) return prev;
                // Play audio chime
                playArrivalChime();
                return [
                  ...prev,
                  {
                    serviceNo: service.ServiceNo,
                    stopDescription: selectedStop.Description,
                    minutes: time.minutes,
                  },
                ];
              });
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch bus arrivals:', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, [selectedStop.BusStopCode, backendConfig, activeAlarms]);

  // Initial load and stop changes
  useEffect(() => {
    fetchArrivals();
    setCountdownSeconds(autoRefreshInterval);
  }, [selectedStop.BusStopCode, fetchArrivals, autoRefreshInterval]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          fetchArrivals();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchArrivals]);

  // Continuous subtle GPS bus motion for map smoothness (every 3s)
  useEffect(() => {
    const motionTimer = setInterval(() => {
      const buses = getActiveBusesTelemetry();
      setActiveBuses(buses);
    }, 3000);
    return () => clearInterval(motionTimer);
  }, []);

  // Handlers
  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
    if (currentTab === 'favorites') {
      setCurrentTab('arrivals');
    }
  };

  const handleSelectStopByCode = (stopCode: string) => {
    const found = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === stopCode);
    if (found) {
      handleSelectStop(found);
    }
  };

  const handleToggleFavoriteStop = (stopCode: string) => {
    setFavoriteStops((prev) =>
      prev.includes(stopCode) ? prev.filter((c) => c !== stopCode) : [...prev, stopCode]
    );
  };

  const handleToggleFavoriteService = (serviceNo: string) => {
    setFavoriteServices((prev) =>
      prev.includes(serviceNo) ? prev.filter((s) => s !== serviceNo) : [...prev, serviceNo]
    );
  };

  const handleToggleAlarm = (serviceNo: string) => {
    setActiveAlarms((prev) => {
      if (prev.includes(serviceNo)) {
        return prev.filter((s) => s !== serviceNo);
      }
      // Give initial pleasant tone feedback
      playArrivalChime();
      return [...prev, serviceNo];
    });
  };

  const handleDismissAlert = (serviceNo: string) => {
    setAlarmAlerts((prev) => prev.filter((a) => a.serviceNo !== serviceNo));
    setActiveAlarms((prev) => prev.filter((s) => s !== serviceNo));
  };

  const handleTrackOnMap = (serviceNo: string) => {
    setTrackedServiceNo(serviceNo);
    setCurrentTab('map');
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefreshInterval((prev) => {
      if (prev === 15) return 30;
      if (prev === 30) return 0; // paused
      return 15;
    });
  };

  const handleSaveBackendConfig = (newConfig: BackendConfig) => {
    setBackendConfig(newConfig);
    try {
      localStorage.setItem('sg_bus_backend_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
    fetchArrivals();
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation access failed or denied, using central Singapore coordinates', err);
        // Default to Central Singapore
        setUserLocation({ lat: 1.3048, lng: 103.8329 });
      },
      { timeout: 6000 }
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        backendConfig={backendConfig}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        favoriteStopsCount={favoriteStops.length}
      />

      {/* Floating Arrival Alarm Banners */}
      <ArrivalAlertBanner
        alerts={alarmAlerts}
        onDismiss={handleDismissAlert}
        onViewStop={() => setCurrentTab('arrivals')}
      />

      {/* Main App Workspace */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Bus Stop Finder & Search Sidebar (Hidden when on full map tab on mobile, visible on desktop) */}
        <aside
          className={`${
            currentTab === 'map' ? 'hidden lg:flex lg:w-80 xl:w-96' : 'flex flex-col w-full md:w-80 lg:w-96'
          } shrink-0 h-full border-r border-slate-800 bg-slate-900 z-10`}
        >
          <BusStopList
            selectedStopCode={selectedStop.BusStopCode}
            onSelectStop={handleSelectStop}
            userLocation={userLocation}
            favoriteStops={favoriteStops}
            onToggleFavoriteStop={handleToggleFavoriteStop}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
          />
        </aside>

        {/* Right Side: Main Display (Arrival Timings or Live Map) */}
        <section className="flex-1 h-full overflow-hidden flex flex-col bg-slate-950 relative">
          {currentTab === 'arrivals' || currentTab === 'favorites' ? (
            <div className="flex-1 h-full overflow-hidden flex flex-col lg:flex-row">
              {/* Bus Arrivals Detail Panel */}
              <div className="flex-1 h-full overflow-y-auto">
                <BusStopDetail
                  stop={selectedStop}
                  services={arrivals}
                  isLoading={isLoadingArrivals}
                  lastUpdated={lastUpdated}
                  onRefresh={fetchArrivals}
                  autoRefreshInterval={autoRefreshInterval}
                  onToggleAutoRefresh={handleToggleAutoRefresh}
                  countdownSeconds={countdownSeconds}
                  isFavoriteStop={favoriteStops.includes(selectedStop.BusStopCode)}
                  onToggleFavoriteStop={handleToggleFavoriteStop}
                  favoriteServices={favoriteServices}
                  onToggleFavoriteService={handleToggleFavoriteService}
                  onInspectRoute={(sNo) => setInspectingRouteServiceNo(sNo)}
                  onTrackOnMap={handleTrackOnMap}
                  activeAlarms={activeAlarms}
                  onToggleAlarm={handleToggleAlarm}
                />
              </div>

              {/* Split Interactive Mini-Map on large screens */}
              <div className="hidden xl:flex xl:w-[420px] 2xl:w-[480px] h-full p-4 border-l border-slate-800 bg-slate-900/40">
                <LiveBusMap
                  selectedStop={selectedStop}
                  onSelectStop={handleSelectStop}
                  trackedServiceNo={trackedServiceNo}
                  activeBuses={activeBuses}
                  userLocation={userLocation}
                  onInspectRoute={(sNo) => setInspectingRouteServiceNo(sNo)}
                />
              </div>
            </div>
          ) : (
            /* Full Live Map View */
            <div className="flex-1 h-full p-2 sm:p-4">
              <LiveBusMap
                selectedStop={selectedStop}
                onSelectStop={handleSelectStop}
                trackedServiceNo={trackedServiceNo}
                activeBuses={activeBuses}
                userLocation={userLocation}
                onInspectRoute={(sNo) => setInspectingRouteServiceNo(sNo)}
              />
            </div>
          )}
        </section>
      </main>

      {/* Route Inspector Modal */}
      <RouteInspectorModal
        serviceNo={inspectingRouteServiceNo}
        onClose={() => setInspectingRouteServiceNo(null)}
        currentStopCode={selectedStop.BusStopCode}
        onSelectStopCode={handleSelectStopByCode}
        activeBuses={activeBuses}
      />

      {/* Backend Connector Modal */}
      <BackendConnectorModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={handleSaveBackendConfig}
      />
    </div>
  );
}
