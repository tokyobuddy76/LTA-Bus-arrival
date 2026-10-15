import {
  BusCrowdLoad,
  BusOperator,
  BusServiceArrival,
  BusStop,
  BusVehicleType,
  LiveBusTracking,
  NextBusInfo,
} from '../types/bus';
import {
  BUS_STOP_SERVICES_MAP,
  SINGAPORE_BUS_SERVICES,
  SINGAPORE_BUS_STOPS,
} from '../data/singaporeBuses';

// Internal state to keep live simulation persistent across short polling cycles
interface SimulatedVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  type: BusVehicleType;
  load: BusCrowdLoad;
  isWab: boolean;
  lat: number;
  lng: number;
  heading: number;
  speedKmH: number;
  targetStopCode: string;
  secondsRemaining: number;
}

// Memory of simulated buses
const activeSimulatedVehicles: Map<string, SimulatedVehicle[]> = new Map();

/**
 * Calculates distance in km between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing angle in degrees between two coordinates
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Format ISO arrival string into human readable countdown
 */
export function formatArrivalTime(estimatedArrivalIso?: string): {
  displayText: string;
  isArr: boolean;
  minutes: number;
  isImminent: boolean;
} {
  if (!estimatedArrivalIso) {
    return { displayText: '--', isArr: false, minutes: -1, isImminent: false };
  }

  const arrivalTime = new Date(estimatedArrivalIso).getTime();
  const now = Date.now();
  const diffSec = Math.round((arrivalTime - now) / 1000);

  if (diffSec <= 45) {
    return { displayText: 'Arr', isArr: true, minutes: 0, isImminent: true };
  }

  const minutes = Math.ceil(diffSec / 60);
  if (minutes <= 1) {
    return { displayText: '1 min', isArr: false, minutes: 1, isImminent: true };
  }

  return {
    displayText: `${minutes} min`,
    isArr: false,
    minutes,
    isImminent: minutes <= 3,
  };
}

/**
 * Initialize or progress simulated vehicles for a stop
 */
function getOrAdvanceSimulatedVehicles(busStopCode: string, targetStop: BusStop): SimulatedVehicle[] {
  let vehicles = activeSimulatedVehicles.get(busStopCode);
  const serviceNumbers = BUS_STOP_SERVICES_MAP[busStopCode] || ['190', '65', '106'];

  if (!vehicles || vehicles.length === 0) {
    vehicles = [];

    serviceNumbers.forEach((serviceNo, sIndex) => {
      const serviceDetail = SINGAPORE_BUS_SERVICES[serviceNo];
      const operator: BusOperator = serviceDetail?.Operator || (['SBST', 'SMRT', 'TTS', 'GAS'][sIndex % 4] as BusOperator);

      // Create NextBus (1 to 6 minutes away)
      const sec1 = 40 + (sIndex * 110) % 360;
      // Approach direction from offset
      const angle = (sIndex * 75 * Math.PI) / 180;
      const distOffset = (sec1 / 60) * 0.005; // ~500m per min

      vehicles!.push({
        id: `${busStopCode}-${serviceNo}-1`,
        serviceNo,
        operator,
        type: sIndex % 2 === 0 ? 'DD' : 'SD',
        load: sIndex % 3 === 0 ? 'SEA' : sIndex % 3 === 1 ? 'SDA' : 'LSD',
        isWab: true,
        lat: targetStop.Latitude + Math.cos(angle) * distOffset,
        lng: targetStop.Longitude + Math.sin(angle) * distOffset,
        heading: calculateBearing(
          targetStop.Latitude + Math.cos(angle) * distOffset,
          targetStop.Longitude + Math.sin(angle) * distOffset,
          targetStop.Latitude,
          targetStop.Longitude
        ),
        speedKmH: 28 + (sIndex % 5) * 4,
        targetStopCode: busStopCode,
        secondsRemaining: sec1,
      });

      // Create NextBus2 (8 to 15 mins away)
      const sec2 = sec1 + 420 + (sIndex * 80) % 300;
      const distOffset2 = (sec2 / 60) * 0.005;
      vehicles!.push({
        id: `${busStopCode}-${serviceNo}-2`,
        serviceNo,
        operator,
        type: sIndex % 3 === 0 ? 'DD' : 'SD',
        load: sIndex % 2 === 0 ? 'SEA' : 'SDA',
        isWab: true,
        lat: targetStop.Latitude + Math.cos(angle + 0.1) * distOffset2,
        lng: targetStop.Longitude + Math.sin(angle + 0.1) * distOffset2,
        heading: calculateBearing(
          targetStop.Latitude + Math.cos(angle + 0.1) * distOffset2,
          targetStop.Longitude + Math.sin(angle + 0.1) * distOffset2,
          targetStop.Latitude,
          targetStop.Longitude
        ),
        speedKmH: 34,
        targetStopCode: busStopCode,
        secondsRemaining: sec2,
      });

      // Create NextBus3 (17 to 24 mins away)
      const sec3 = sec2 + 500;
      const distOffset3 = (sec3 / 60) * 0.005;
      vehicles!.push({
        id: `${busStopCode}-${serviceNo}-3`,
        serviceNo,
        operator,
        type: 'DD',
        load: 'SEA',
        isWab: true,
        lat: targetStop.Latitude + Math.cos(angle + 0.2) * distOffset3,
        lng: targetStop.Longitude + Math.sin(angle + 0.2) * distOffset3,
        heading: calculateBearing(
          targetStop.Latitude + Math.cos(angle + 0.2) * distOffset3,
          targetStop.Longitude + Math.sin(angle + 0.2) * distOffset3,
          targetStop.Latitude,
          targetStop.Longitude
        ),
        speedKmH: 30,
        targetStopCode: busStopCode,
        secondsRemaining: sec3,
      });
    });

    activeSimulatedVehicles.set(busStopCode, vehicles);
  } else {
    // Advance vehicles closer to stop
    vehicles.forEach((v) => {
      // decrement remaining seconds
      v.secondsRemaining -= 4; // simulated progress step

      if (v.secondsRemaining <= 10) {
        // Bus arrives and resets cycle to next dispatch (e.g. 15-20 mins)
        v.secondsRemaining = 900 + Math.floor(Math.random() * 300);
        // reposition back on origin path
        const randomAngle = Math.random() * 2 * Math.PI;
        const newDist = (v.secondsRemaining / 60) * 0.005;
        v.lat = targetStop.Latitude + Math.cos(randomAngle) * newDist;
        v.lng = targetStop.Longitude + Math.sin(randomAngle) * newDist;
      } else {
        // Interpolate smoothly towards target stop
        const ratio = Math.max(0.01, (v.secondsRemaining - 4) / v.secondsRemaining);
        v.lat = targetStop.Latitude + (v.lat - targetStop.Latitude) * ratio;
        v.lng = targetStop.Longitude + (v.lng - targetStop.Longitude) * ratio;
        v.heading = calculateBearing(v.lat, v.lng, targetStop.Latitude, targetStop.Longitude);
        v.speedKmH = Math.min(48, Math.max(15, 25 + Math.sin(Date.now() / 5000) * 10));
      }
    });
  }

  return vehicles;
}

/**
 * Fetch Real-Time Bus Arrivals for a bus stop
 * Supports both custom backend proxy API and high-fidelity LTA simulated feed
 */
export async function getBusArrivals(
  busStopCode: string,
  customApiUrl?: string,
  apiKey?: string
): Promise<{
  busStopCode: string;
  services: BusServiceArrival[];
  timestamp: string;
  source: 'simulated' | 'custom_api';
}> {
  // If user provided a custom backend API endpoint, attempt live fetch!
  if (customApiUrl && customApiUrl.trim().length > 0) {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(customApiUrl, base);
      url.searchParams.set('BusStopCode', busStopCode);

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (apiKey) {
        headers['AccountKey'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        // Standard LTA DataMall v2 response structure: { BusStopCode: "...", Services: [...] }
        if (data && Array.isArray(data.Services)) {
          return {
            busStopCode,
            services: data.Services,
            timestamp: new Date().toISOString(),
            source: 'custom_api',
          };
        }
      }
    } catch (err) {
      console.warn('Custom backend API call failed, falling back to simulated engine:', err);
    }
  }

  // Simulated engine matching exact LTA DataMall specifications
  const targetStop =
    SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === busStopCode) ||
    SINGAPORE_BUS_STOPS[0];

  const vehicles = getOrAdvanceSimulatedVehicles(busStopCode, targetStop);
  const serviceNumbers = BUS_STOP_SERVICES_MAP[busStopCode] || ['190', '65', '106'];

  const now = Date.now();
  const services: BusServiceArrival[] = [];

  serviceNumbers.forEach((serviceNo) => {
    const serviceVehicles = vehicles
      .filter((v) => v.serviceNo === serviceNo)
      .sort((a, b) => a.secondsRemaining - b.secondsRemaining);

    const v1 = serviceVehicles[0];
    const v2 = serviceVehicles[1];
    const v3 = serviceVehicles[2];

    const toNextBusInfo = (v?: SimulatedVehicle): NextBusInfo => {
      if (!v) {
        return {
          OriginCode: '08057',
          DestinationCode: '03239',
          EstimatedArrival: '',
          Latitude: '0.0',
          Longitude: '0.0',
          VisitNumber: '1',
          Load: 'SEA',
          Feature: 'WAB',
          Type: 'SD',
        };
      }

      const arrivalDate = new Date(now + v.secondsRemaining * 1000);

      return {
        OriginCode: '08057',
        DestinationCode: '03239',
        EstimatedArrival: arrivalDate.toISOString(),
        Latitude: v.lat.toFixed(6),
        Longitude: v.lng.toFixed(6),
        VisitNumber: '1',
        Load: v.load,
        Feature: v.isWab ? 'WAB' : '',
        Type: v.type,
        SpeedKmH: Math.round(v.speedKmH),
      };
    };

    services.push({
      ServiceNo: serviceNo,
      Operator: v1?.operator || 'SBST',
      NextBus: toNextBusInfo(v1),
      NextBus2: v2 ? toNextBusInfo(v2) : undefined,
      NextBus3: v3 ? toNextBusInfo(v3) : undefined,
    });
  });

  // Sort services alphanumerically
  services.sort((a, b) => {
    const numA = parseInt(a.ServiceNo, 10);
    const numB = parseInt(b.ServiceNo, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.ServiceNo.localeCompare(b.ServiceNo);
  });

  return {
    busStopCode,
    services,
    timestamp: new Date().toISOString(),
    source: 'simulated',
  };
}

/**
 * Get active bus location tracking telemetry for map visualization
 */
export function getActiveBusesTelemetry(busStopCode?: string): LiveBusTracking[] {
  const result: LiveBusTracking[] = [];

  activeSimulatedVehicles.forEach((vehicles) => {
    vehicles.forEach((v) => {
      if (!busStopCode || v.targetStopCode === busStopCode) {
        result.push({
          id: v.id,
          serviceNo: v.serviceNo,
          operator: v.operator,
          lat: v.lat,
          lng: v.lng,
          heading: v.heading,
          load: v.load,
          type: v.type,
          isWab: v.isWab,
          speed: v.speedKmH,
          targetStopCode: v.targetStopCode,
          currentStopSequence: 1,
          nextArrivalEtaSeconds: v.secondsRemaining,
        });
      }
    });
  });

  return result;
}

/**
 * Find nearby bus stops ordered by closest distance from user coordinates
 */
export function getNearbyStops(
  userLat: number,
  userLng: number,
  limit = 10
): { stop: BusStop; distanceKm: number }[] {
  return SINGAPORE_BUS_STOPS.map((stop) => ({
    stop,
    distanceKm: calculateDistanceKm(userLat, userLng, stop.Latitude, stop.Longitude),
  }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
