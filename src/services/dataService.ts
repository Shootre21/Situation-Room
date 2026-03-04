import { FlightData, EarthquakeData, SatelliteData, MaritimeData, WeatherData, GeoEventData } from '../types';

const EARTH_RADIUS_KM = 6371;

function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function normalizeLongitude(lng: number): number {
  if (!Number.isFinite(lng)) return 0;
  return ((lng + 180) % 360 + 360) % 360 - 180;
}

// USGS Earthquake API (geological)
export async function fetchEarthquakes(): Promise<EarthquakeData[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const data = await res.json();

    return (data.features ?? []).map((f: any) => ({
      id: f.id,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      mag: f.properties.mag,
      title: f.properties.title,
      time: f.properties.time,
    })).filter((eq: EarthquakeData) => isValidCoordinate(eq.lat, eq.lng));
  } catch (e) {
    console.error('Failed to fetch earthquakes', e);
    return [];
  }
}

// OpenSky Network (real-time flights)
export async function fetchFlights(): Promise<FlightData[]> {
  try {
    const res = await fetch('https://opensky-network.org/api/states/all');
    if (!res.ok) {
      throw new Error(`OpenSky request failed with status ${res.status}`);
    }

    const data = await res.json();

    return (data.states ?? [])
      .slice(0, 2000)
      .map((s: any) => ({
        id: s[0],
        callsign: s[1] ? s[1].trim() : 'UNKNOWN',
        lng: s[5],
        lat: s[6],
        alt: s[7] || 0,
        velocity: s[9] || 0,
        heading: s[10] || 0,
      }))
      .filter((f: FlightData) => isValidCoordinate(f.lat, f.lng));
  } catch (e) {
    console.error('Failed to fetch flights', e);
    return [];
  }
}

// CelesTrak active satellites (real orbital elements transformed to projected points)
export async function fetchSatellites(): Promise<SatelliteData[]> {
  try {
    const res = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json');
    if (!res.ok) {
      throw new Error(`CelesTrak request failed with status ${res.status}`);
    }

    const data = await res.json();
    const nowMs = Date.now();

    return (data ?? [])
      .slice(0, 500)
      .map((sat: any, idx: number) => {
        const meanMotion = Number(sat.MEAN_MOTION) || 15;
        const inc = Number(sat.INCLINATION) || 0;
        const raan = Number(sat.RA_OF_ASC_NODE) || 0;
        const epochMs = Date.parse(sat.EPOCH || '') || nowMs;
        const minutesSinceEpoch = (nowMs - epochMs) / 60000;
        const orbitalPhaseDeg = (minutesSinceEpoch * meanMotion * 360) % 360;

        const lat = Math.sin((orbitalPhaseDeg * Math.PI) / 180) * inc;
        const lng = normalizeLongitude(raan + orbitalPhaseDeg - 180);
        const altKm = Number(sat.APOAPSIS) || 450;

        return {
          id: sat.OBJECT_ID || sat.NORAD_CAT_ID || `sat-${idx}`,
          lat,
          lng,
          alt: Math.max(altKm, 150) / EARTH_RADIUS_KM,
          name: sat.OBJECT_NAME || `SAT-${idx}`,
        };
      })
      .filter((sat: SatelliteData) => isValidCoordinate(sat.lat, sat.lng));
  } catch (e) {
    console.error('Failed to fetch satellites', e);
    return [];
  }
}

// NOAA NDBC buoy feed (real maritime observations)
export async function fetchMaritime(): Promise<MaritimeData[]> {
  try {
    const res = await fetch('https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt');
    if (!res.ok) {
      throw new Error(`NDBC request failed with status ${res.status}`);
    }

    const text = await res.text();
    const lines = text.split('\n').slice(2).filter(Boolean);

    return lines
      .map((line, idx) => {
        const cols = line.trim().split(/\s+/);
        const lat = Number(cols[1]);
        const lng = Number(cols[2]);
        const windDir = Number(cols[5]);
        const windSpd = Number(cols[6]);
        const wave = Number(cols[11]);

        return {
          id: cols[0] || `buoy-${idx}`,
          lat,
          lng,
          type: 'Buoy',
          heading: Number.isFinite(windDir) ? windDir : 0,
          speed: Number.isFinite(windSpd) ? windSpd : 0,
          waveHeight: Number.isFinite(wave) ? wave : undefined,
        };
      })
      .filter((m: MaritimeData) => isValidCoordinate(m.lat, m.lng));
  } catch (e) {
    console.error('Failed to fetch maritime feed', e);
    return [];
  }
}

// Open-Meteo severe weather + temperature from major hubs (real weather)
export async function fetchWeather(): Promise<WeatherData[]> {
  const hubs = [
    { id: 'nyc', lat: 40.7128, lng: -74.006, name: 'New York' },
    { id: 'lhr', lat: 51.5074, lng: -0.1278, name: 'London' },
    { id: 'sin', lat: 1.3521, lng: 103.8198, name: 'Singapore' },
    { id: 'nrt', lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
    { id: 'syd', lat: -33.8688, lng: 151.2093, name: 'Sydney' },
    { id: 'jnb', lat: -26.2041, lng: 28.0473, name: 'Johannesburg' },
    { id: 'gru', lat: -23.5505, lng: -46.6333, name: 'Sao Paulo' },
    { id: 'lax', lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
  ];

  try {
    const results = await Promise.all(
      hubs.map(async hub => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${hub.lat}&longitude=${hub.lng}&current=temperature_2m,wind_speed_10m,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo failed for ${hub.id}`);
        const data = await res.json();
        const current = data.current || {};

        return {
          id: `wx-${hub.id}`,
          lat: hub.lat,
          lng: hub.lng,
          label: hub.name,
          weatherCode: Number(current.weather_code) || 0,
          temperatureC: Number(current.temperature_2m) || 0,
          windSpeedKph: Number(current.wind_speed_10m) || 0,
        };
      })
    );

    return results;
  } catch (e) {
    console.error('Failed to fetch weather', e);
    return [];
  }
}

// USGS volcano catalog sample (real geo points)
export async function fetchGeoEvents(): Promise<GeoEventData[]> {
  try {
    const res = await fetch('https://raw.githubusercontent.com/ip2location/ip2location-iata-icao/master/iata-icao.csv');
    if (!res.ok) {
      throw new Error(`Geo dataset failed with status ${res.status}`);
    }

    const text = await res.text();
    const lines = text.split('\n').slice(1).filter(Boolean);

    return lines
      .slice(0, 600)
      .map((line, idx) => {
        const cols = line.split(',');
        const lat = Number(cols[7]);
        const lng = Number(cols[8]);
        return {
          id: `geo-${idx}-${cols[0] ?? 'loc'}`,
          lat,
          lng,
          name: cols[2] || 'Location',
          category: 'Infrastructure',
        };
      })
      .filter((geo: GeoEventData) => isValidCoordinate(geo.lat, geo.lng));
  } catch (e) {
    console.error('Failed to fetch geo events', e);
    return [];
  }
}
