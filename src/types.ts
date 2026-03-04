export interface LayerState {
  flights: boolean;
  maritime: boolean;
  satellites: boolean;
  geological: boolean;
  infrastructure: boolean;
  conflict: boolean;
  weather: boolean;
}

export interface FlightData {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  callsign: string;
  velocity: number;
  heading: number;
}

export interface EarthquakeData {
  id: string;
  lat: number;
  lng: number;
  mag: number;
  title: string;
  time: number;
}

export interface SatelliteData {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  name: string;
}

export interface MaritimeData {
  id: string;
  lat: number;
  lng: number;
  type: string;
  heading: number;
  speed: number;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  lat?: number;
  lng?: number;
}

export interface GlobalStats {
  activeFlights: number;
  activeShips: number;
  satellitesTracked: number;
  recentEarthquakes: number;
}
