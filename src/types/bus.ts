/**
 * LTA DataMall Singapore Bus Data Types
 * Closely models Land Transport Authority (LTA) Datamall v2 BusArrival & BusStop APIs
 */

export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

// Crowding Load according to LTA DataMall:
// SEA: Seats Available (Green)
// SDA: Standing Available (Amber/Yellow)
// LSD: Limited Standing (Red)
export type BusCrowdLoad = 'SEA' | 'SDA' | 'LSD';

// Bus Type:
// SD: Single Deck
// DD: Double Deck
// BD: Bendy
export type BusVehicleType = 'SD' | 'DD' | 'BD';

export interface NextBusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 string
  Latitude: string; // GPS Latitude e.g. "1.3042" or "0.0"
  Longitude: string; // GPS Longitude e.g. "103.8321" or "0.0"
  VisitNumber: string; // "1" or "2"
  Load: BusCrowdLoad; // SEA | SDA | LSD
  Feature: 'WAB' | ''; // Wheelchair accessible
  Type: BusVehicleType; // SD | DD | BD
  SpeedKmH?: number;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: NextBusInfo;
  NextBus2?: NextBusInfo;
  NextBus3?: NextBusInfo;
}

export interface BusStop {
  BusStopCode: string; // 5 digits e.g. "08057"
  RoadName: string; // e.g. "Orchard Rd"
  Description: string; // e.g. "Orchard Stn/Tang Plaza"
  Latitude: number; // 1.3040
  Longitude: number; // 103.8320
  MrtLines?: ('NSL' | 'EWL' | 'NEL' | 'CCL' | 'DTL' | 'TEL')[];
  Region?: 'Central' | 'North' | 'East' | 'West' | 'North-East';
}

export interface BusRouteStop {
  BusStopCode: string;
  StopSequence: number;
  DistanceKm: number;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

export interface BusServiceDetail {
  ServiceNo: string;
  Operator: BusOperator;
  Direction: 1 | 2;
  OriginCode: string;
  DestinationCode: string;
  LoopDesc?: string;
  FirstBusWeekday: string;
  LastBusWeekday: string;
  FrequencyPeakMins: string;
  FrequencyOffpeakMins: string;
  Route: BusRouteStop[];
}

export interface LiveBusTracking {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  lat: number;
  lng: number;
  heading: number;
  load: BusCrowdLoad;
  type: BusVehicleType;
  isWab: boolean;
  speed: number;
  targetStopCode: string;
  currentStopSequence: number;
  nextArrivalEtaSeconds: number;
}

export interface BackendConfig {
  mode: 'simulated' | 'custom_api';
  apiUrl: string;
  apiKey?: string;
  refreshInterval: number; // in seconds, default 15
}
