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
  source?: string;
}

export interface EarthquakeData {
  id: string;
  lat: number;
  lng: number;
  mag: number;
  title: string;
  time: number;
  source?: string;
}

export interface SatelliteData {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  name: string;
  source?: string;
}

export interface MaritimeData {
  id: string;
  lat: number;
  lng: number;
  type: string;
  heading: number;
  speed: number;
  waveHeight?: number;
  source?: string;
}

export interface WeatherData {
  id: string;
  lat: number;
  lng: number;
  label: string;
  weatherCode: number;
  temperatureC: number;
  windSpeedKph: number;
  source?: string;
  observedAt?: string;
}

export interface GeoEventData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  source?: string;
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
