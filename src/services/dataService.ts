import { FlightData, EarthquakeData, SatelliteData, MaritimeData, Alert } from '../types';

// USGS Earthquake API
export async function fetchEarthquakes(): Promise<EarthquakeData[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const data = await res.json();
    return data.features.map((f: any) => ({
      id: f.id,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      mag: f.properties.mag,
      title: f.properties.title,
      time: f.properties.time,
    }));
  } catch (e) {
    console.error('Failed to fetch earthquakes', e);
    return [];
  }
}

// OpenSky API (often rate limited, so we might need to mock if it fails)
export async function fetchFlights(): Promise<FlightData[]> {
  try {
    const res = await fetch('https://opensky-network.org/api/states/all');
    if (!res.ok) throw new Error('Rate limited');
    const data = await res.json();
    return data.states.slice(0, 1000).map((s: any) => ({
      id: s[0],
      callsign: s[1] ? s[1].trim() : 'UNKNOWN',
      lng: s[5],
      lat: s[6],
      alt: s[7] || 0,
      velocity: s[9] || 0,
      heading: s[10] || 0,
    })).filter((f: any) => f.lat && f.lng);
  } catch (e) {
    console.warn('Using mock flights due to OpenSky limits');
    return Array.from({ length: 500 }).map((_, i) => ({
      id: `mock-flight-${i}`,
      lat: (Math.random() - 0.5) * 160,
      lng: (Math.random() - 0.5) * 360,
      alt: Math.random() * 12000,
      callsign: `FLT${Math.floor(Math.random() * 9999)}`,
      velocity: 200 + Math.random() * 300,
      heading: Math.random() * 360,
    }));
  }
}

// Mock Satellites
export function fetchSatellites(): SatelliteData[] {
  return Array.from({ length: 200 }).map((_, i) => ({
    id: `sat-${i}`,
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    alt: 400 + Math.random() * 800, // km
    name: `SAT-${Math.floor(Math.random() * 9999)}`,
  }));
}

// Mock Maritime
export function fetchMaritime(): MaritimeData[] {
  return Array.from({ length: 800 }).map((_, i) => ({
    id: `ship-${i}`,
    lat: (Math.random() - 0.5) * 140, // mostly oceans
    lng: (Math.random() - 0.5) * 360,
    type: ['Cargo', 'Tanker', 'Military'][Math.floor(Math.random() * 3)],
    heading: Math.random() * 360,
    speed: Math.random() * 40,
  }));
}
