import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusServiceArrival, BusStop, LiveBusTracking } from '../types/bus';
import { SINGAPORE_BUS_STOPS, SINGAPORE_BUS_SERVICES, OPERATOR_METADATA } from '../data/singaporeBuses';
import { Layers, Locate, Maximize2, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

interface LiveBusMapProps {
  selectedStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  trackedServiceNo: string | null;
  activeBuses: LiveBusTracking[];
  userLocation: { lat: number; lng: number } | null;
  onInspectRoute: (serviceNo: string) => void;
}

export const LiveBusMap: React.FC<LiveBusMapProps> = ({
  selectedStop,
  onSelectStop,
  trackedServiceNo,
  activeBuses,
  userLocation,
  onInspectRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const busMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets'>('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map instance centered on selectedStop or Singapore central
    const map = L.map(mapContainerRef.current, {
      center: [selectedStop.Latitude, selectedStop.Longitude],
      zoom: 15,
      zoomControl: false,
    });

    // Tile layer - CartoDB Dark Matter / Voyager
    const tileUrl =
      mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Layer groups for markers
    const stopMarkers = L.layerGroup().addTo(map);
    const busMarkers = L.layerGroup().addTo(map);

    markersLayerRef.current = stopMarkers;
    busMarkersLayerRef.current = busMarkers;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl =
      mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
  }, [mapStyle]);

  // Render Bus Stops
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const stopLayer = markersLayerRef.current;
    stopLayer.clearLayers();

    SINGAPORE_BUS_STOPS.forEach((stop) => {
      const isSelected = stop.BusStopCode === selectedStop.BusStopCode;

      // Custom HTML Pin icon
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform ${
            isSelected
              ? 'bg-emerald-500 ring-4 ring-emerald-400/40 text-slate-950 scale-125 z-30'
              : 'bg-slate-800 border-2 border-emerald-500/80 text-emerald-400 hover:scale-110 z-10'
          }">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v5H5z"/>
            </svg>
          </div>
          ${
            isSelected
              ? '<span class="absolute -bottom-6 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] font-mono shadow">HERE</span>'
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-bus-stop-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([stop.Latitude, stop.Longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="p-1 min-w-[190px]">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-emerald-400 text-xs font-mono font-bold rounded">
              ${stop.BusStopCode}
            </span>
            <span class="text-[11px] text-slate-400">${stop.RoadName}</span>
          </div>
          <h4 class="font-bold text-sm text-white mb-2">${stop.Description}</h4>
          <button id="popup-select-${stop.BusStopCode}" class="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded transition">
            View Live Arrivals
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${stop.BusStopCode}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStop(stop);
            marker.closePopup();
          };
        }
      });

      stopLayer.addLayer(marker);
    });
  }, [selectedStop]);

  // Render Live Moving Buses
  useEffect(() => {
    if (!mapInstanceRef.current || !busMarkersLayerRef.current) return;
    const busLayer = busMarkersLayerRef.current;
    busLayer.clearLayers();

    activeBuses.forEach((bus) => {
      const isTracked = trackedServiceNo === bus.serviceNo;
      const operator = OPERATOR_METADATA[bus.operator] || OPERATOR_METADATA.SBST;

      // Color load dot
      const loadColor =
        bus.load === 'SEA' ? '#10b981' : bus.load === 'SDA' ? '#f59e0b' : '#ef4444';

      const busHtml = `
        <div class="relative flex items-center justify-center">
          <div class="flex items-center gap-1 px-2 py-1 rounded-full border shadow-xl transition-transform ${
            isTracked
              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/40 scale-125 z-40'
              : 'bg-slate-900 text-white border-slate-700 hover:scale-110 z-20'
          }">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${loadColor}"></span>
            <span class="font-black font-mono text-xs">${bus.serviceNo}</span>
            <span class="text-[9px] opacity-80 font-mono">${bus.type}</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        html: busHtml,
        className: 'custom-live-bus-marker',
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const marker = L.marker([bus.lat, bus.lng], { icon: busIcon });

      marker.bindPopup(`
        <div class="p-1 min-w-[200px]">
          <div class="flex items-center justify-between mb-1">
            <span class="font-extrabold text-base text-white font-mono">Bus ${bus.serviceNo}</span>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${operator.badgeClass}">
              ${bus.operator}
            </span>
          </div>
          <div class="text-xs text-slate-300 space-y-1 mb-2">
            <p><strong>Load:</strong> ${
              bus.load === 'SEA' ? 'Seats Available' : bus.load === 'SDA' ? 'Standing Available' : 'Crowded'
            }</p>
            <p><strong>Speed:</strong> ~${Math.round(bus.speed)} km/h</p>
            <p><strong>Next Stop:</strong> Stop #${bus.targetStopCode}</p>
          </div>
          <button id="inspect-route-${bus.serviceNo}" class="w-full py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded">
            Inspect Route Timeline
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-route-${bus.serviceNo}`);
        if (btn) {
          btn.onclick = () => {
            onInspectRoute(bus.serviceNo);
            marker.closePopup();
          };
        }
      });

      busLayer.addLayer(marker);
    });
  }, [activeBuses, trackedServiceNo]);

  // Render Route Polyline if a service is tracked
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (trackedServiceNo && SINGAPORE_BUS_SERVICES[trackedServiceNo]) {
      const serviceDetail = SINGAPORE_BUS_SERVICES[trackedServiceNo];
      const latlngs: [number, number][] = serviceDetail.Route.map((stop) => [
        stop.Latitude,
        stop.Longitude,
      ]);

      const polyline = L.polyline(latlngs, {
        color: '#10b981',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      routePolylineRef.current = polyline;
    }
  }, [trackedServiceNo]);

  // Recenter map when selected stop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedStop.Latitude, selectedStop.Longitude], 15, {
      duration: 1.2,
    });
  }, [selectedStop]);

  // User location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    const userHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-4 h-4 rounded-full bg-sky-500 ring-4 ring-sky-400/40 shadow-lg"></div>
        <div class="w-8 h-8 rounded-full bg-sky-500/20 absolute animate-ping"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'user-location-pin',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindPopup('<div class="text-xs font-bold text-white">Your Current Location</div>')
      .addTo(map);

    return () => {
      map.removeLayer(userMarker);
    };
  }, [userLocation]);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Toggle Dark / Streets Map Tile */}
        <button
          onClick={() => setMapStyle((prev) => (prev === 'dark' ? 'streets' : 'dark'))}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl backdrop-blur transition-all"
          title="Toggle Map Style"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Center on Selected Stop */}
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([selectedStop.Latitude, selectedStop.Longitude], 16);
            }
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700 shadow-xl backdrop-blur transition-all"
          title="Center on Selected Bus Stop"
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Center on User Location */}
        {userLocation && (
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16);
              }
            }}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-slate-700 shadow-xl backdrop-blur transition-all"
            title="Center on My Location"
          >
            <Locate className="w-4 h-4" />
          </button>
        )}

        {/* Zoom Singapore Whole Island */}
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([1.3521, 103.8198], 12);
            }
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-xl backdrop-blur transition-all"
          title="Zoom to Singapore Overview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom Info Pill */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-200 font-medium">
              Tracking <span className="font-bold text-emerald-400">{activeBuses.length}</span> live buses in Singapore
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 border-l border-slate-700 pl-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Seats
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Standing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Crowded
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
