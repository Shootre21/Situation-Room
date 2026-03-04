import { FlightData, EarthquakeData, SatelliteData, MaritimeData, WeatherData, GeoEventData } from '../types';

const EARTH_RADIUS_KM = 6371;

function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function normalizeLongitude(lng: number): number {
  if (!Number.isFinite(lng)) return 0;
  return ((lng + 180) % 360 + 360) % 360 - 180;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function fetchEarthquakes(targetTimeMs = Date.now()): Promise<EarthquakeData[]> {
  const end = new Date(targetTimeMs);
  const start = new Date(targetTimeMs - 24 * 60 * 60 * 1000);
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start.toISOString()}&endtime=${end.toISOString()}&minmagnitude=2.5`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return (data.features ?? [])
      .map((f: any) => ({
        id: f.id,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        mag: f.properties.mag,
        title: f.properties.title,
        time: f.properties.time,
        source: 'USGS',
      }))
      .filter((eq: EarthquakeData) => isValidCoordinate(eq.lat, eq.lng));
  } catch (e) {
    console.error('Failed to fetch earthquakes', e);
    return [];
  }
}

export async function fetchFlights(): Promise<FlightData[]> {
  const fetchedAt = Date.now();

  try {
    const res = await fetch('https://opensky-network.org/api/states/all');
    if (!res.ok) {
      throw new Error(`OpenSky request failed with status ${res.status}`);
    }

    const data = await res.json();

    return (data.states ?? [])
      .slice(0, 2400)
      .map((s: any) => ({
        id: s[0],
        callsign: s[1] ? s[1].trim() : 'UNKNOWN',
        lng: s[5],
        lat: s[6],
        alt: s[7] || 0,
        velocity: s[9] || 0,
        heading: s[10] || 0,
        source: 'OpenSky',
        fetchedAt,
      }))
      .filter((f: FlightData) => isValidCoordinate(f.lat, f.lng));
  } catch (e) {
    console.error('Failed to fetch flights', e);
    return [];
  }
}

export async function fetchSatellites(): Promise<SatelliteData[]> {
  const fetchedAt = Date.now();

  try {
    const res = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json');
    if (!res.ok) {
      throw new Error(`CelesTrak request failed with status ${res.status}`);
    }

    const data = await res.json();

    return (data ?? [])
      .slice(0, 750)
      .map((sat: any, idx: number) => {
        const meanMotion = Number(sat.MEAN_MOTION) || 15;
        const inc = Number(sat.INCLINATION) || 0;
        const raan = Number(sat.RA_OF_ASC_NODE) || 0;
        const epochMs = Date.parse(sat.EPOCH || '') || fetchedAt;
        const minutesSinceEpoch = (fetchedAt - epochMs) / 60000;
        const orbitalPhaseDeg = (minutesSinceEpoch * meanMotion * 360) % 360;

        const lat = Math.sin((orbitalPhaseDeg * Math.PI) / 180) * inc;
        const lng = normalizeLongitude(raan + orbitalPhaseDeg - 180);
        const altKm = Number(sat.APOAPSIS) || 450;
        const isGeo = meanMotion > 0.95 && meanMotion < 1.05;

        return {
          id: sat.OBJECT_ID || sat.NORAD_CAT_ID || `sat-${idx}`,
          lat,
          lng,
          alt: Math.max(altKm, 150) / EARTH_RADIUS_KM,
          name: sat.OBJECT_NAME || `SAT-${idx}`,
          source: 'CelesTrak',
          fetchedAt,
          meanMotion,
          inclination: inc,
          orbitClass: isGeo ? 'geosynchronous' : 'leo-meo',
        };
      })
      .filter((sat: SatelliteData) => isValidCoordinate(sat.lat, sat.lng));
  } catch (e) {
    console.error('Failed to fetch satellites', e);
    return [];
  }
}

async function fetchNoaaTides(fetchedAt: number): Promise<MaritimeData[]> {
  const stationRefs = [
    { id: '9414290', name: 'San Francisco', lat: 37.8063, lng: -122.4659 },
    { id: '8518750', name: 'The Battery', lat: 40.7006, lng: -74.0142 },
    { id: '1612340', name: 'Honolulu', lat: 21.3069, lng: -157.8676 },
  ];

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const responses = await Promise.all(
    stationRefs.map(async station => {
      const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_level&application=situation-room&begin_date=${today}&end_date=${today}&datum=MLLW&station=${station.id}&time_zone=gmt&units=metric&format=json`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`NOAA tides failed for ${station.id}`);
      }
      const data = await res.json();
      const latest = (data.data ?? []).at(-1);
      const level = Number(latest?.v);

      return {
        id: `tide-${station.id}`,
        lat: station.lat,
        lng: station.lng,
        type: `Tide ${station.name}`,
        heading: 0,
        speed: 0,
        waveHeight: Number.isFinite(level) ? Math.max(level, 0) : undefined,
        source: 'NOAA Tides',
        fetchedAt,
      } as MaritimeData;
    })
  );

  return responses;
}

export async function fetchMaritime(): Promise<MaritimeData[]> {
  const fetchedAt = Date.now();

  try {
    const ndbcPromise = fetch('https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt')
      .then(async res => {
        if (!res.ok) {
          throw new Error(`NDBC request failed with status ${res.status}`);
        }

        const text = await res.text();
        const lines = text.split('\n').slice(2).filter(Boolean);

        return lines
          .slice(0, 350)
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
              type: 'NDBC Buoy',
              heading: Number.isFinite(windDir) ? windDir : 0,
              speed: Number.isFinite(windSpd) ? windSpd : 0,
              waveHeight: Number.isFinite(wave) ? wave : undefined,
              source: 'NOAA NDBC',
              fetchedAt,
            };
          })
          .filter((m: MaritimeData) => isValidCoordinate(m.lat, m.lng));
      })
      .catch(() => [] as MaritimeData[]);

    const tidesPromise = fetchNoaaTides(fetchedAt).catch(() => [] as MaritimeData[]);

    const [ndbc, tides] = await Promise.all([ndbcPromise, tidesPromise]);
    return dedupeById([...ndbc, ...tides]);
  } catch (e) {
    console.error('Failed to fetch maritime feed', e);
    return [];
  }
}

export async function fetchWeather(targetTimeMs = Date.now()): Promise<WeatherData[]> {
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

  const targetDate = new Date(targetTimeMs);
  const dateIso = targetDate.toISOString().slice(0, 10);
  const hourIso = targetDate.toISOString().slice(0, 13) + ':00';

  try {
    const meteoResults = await Promise.all(
      hubs.map(async hub => {
        const isHistorical = Date.now() - targetTimeMs > 60 * 60 * 1000;
        const url = isHistorical
          ? `https://archive-api.open-meteo.com/v1/archive?latitude=${hub.lat}&longitude=${hub.lng}&start_date=${dateIso}&end_date=${dateIso}&hourly=temperature_2m,wind_speed_10m,weather_code`
          : `https://api.open-meteo.com/v1/forecast?latitude=${hub.lat}&longitude=${hub.lng}&current=temperature_2m,wind_speed_10m,weather_code`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo failed for ${hub.id}`);
        const data = await res.json();

        if (isHistorical) {
          const times: string[] = data.hourly?.time || [];
          const idx = Math.max(times.findIndex(t => t.startsWith(hourIso.slice(0, 13))), 0);
          return {
            id: `wx-${hub.id}`,
            lat: hub.lat,
            lng: hub.lng,
            label: hub.name,
            weatherCode: Number(data.hourly?.weather_code?.[idx]) || 0,
            temperatureC: Number(data.hourly?.temperature_2m?.[idx]) || 0,
            windSpeedKph: Number(data.hourly?.wind_speed_10m?.[idx]) || 0,
            source: 'Open-Meteo Archive',
            observedAt: times[idx],
          };
        }

        const current = data.current || {};
        return {
          id: `wx-${hub.id}`,
          lat: hub.lat,
          lng: hub.lng,
          label: hub.name,
          weatherCode: Number(current.weather_code) || 0,
          temperatureC: Number(current.temperature_2m) || 0,
          windSpeedKph: Number(current.wind_speed_10m) || 0,
          source: 'Open-Meteo',
          observedAt: current.time,
        };
      })
    );

    const noaaAlerts = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert')
      .then(async res => {
        if (!res.ok) throw new Error('NOAA alerts failed');
        const data = await res.json();
        return (data.features ?? [])
          .slice(0, 40)
          .map((f: any, idx: number) => ({
            id: `noaa-${idx}-${f.id}`,
            lat: Number(f.geometry?.coordinates?.[0]?.[0]?.[1]) || 38 + (idx % 8),
            lng: Number(f.geometry?.coordinates?.[0]?.[0]?.[0]) || -97 + (idx % 10),
            label: `NOAA ${f.properties?.event || 'Alert'}`,
            weatherCode: 99,
            temperatureC: 0,
            windSpeedKph: 0,
            source: 'NOAA Weather.gov',
            observedAt: f.properties?.sent,
          } as WeatherData))
          .filter((w: WeatherData) => isValidCoordinate(w.lat, w.lng));
      })
      .catch(() => [] as WeatherData[]);

    return dedupeById([...meteoResults, ...noaaAlerts]);
  } catch (e) {
    console.error('Failed to fetch weather', e);
    return [];
  }
}

export async function fetchGeoEvents(): Promise<GeoEventData[]> {
  try {
    const [airports, geonames] = await Promise.all([
      fetch('https://raw.githubusercontent.com/ip2location/ip2location-iata-icao/master/iata-icao.csv')
        .then(async res => {
          if (!res.ok) throw new Error();
          const text = await res.text();
          const lines = text.split('\n').slice(1).filter(Boolean);
          return lines
            .slice(0, 400)
            .map((line, idx) => {
              const cols = line.split(',');
              const lat = Number(cols[7]);
              const lng = Number(cols[8]);
              return {
                id: `airport-${idx}-${cols[0] ?? 'loc'}`,
                lat,
                lng,
                name: cols[2] || 'Airport',
                category: 'Infrastructure',
                source: 'IP2Location Airport DB',
              };
            })
            .filter((geo: GeoEventData) => isValidCoordinate(geo.lat, geo.lng));
        })
        .catch(() => [] as GeoEventData[]),
      fetch('https://secure.geonames.org/earthquakesJSON?north=90&south=-90&east=180&west=-180&username=demo')
        .then(async res => {
          if (!res.ok) throw new Error();
          const data = await res.json();
          return (data.earthquakes ?? [])
            .map((eq: any, idx: number) => ({
              id: `geonames-eq-${idx}`,
              lat: Number(eq.lat),
              lng: Number(eq.lng),
              name: eq.eqid || 'GeoNames Event',
              category: 'GeoNames Seismic',
              source: 'GeoNames',
            } as GeoEventData))
            .filter((geo: GeoEventData) => isValidCoordinate(geo.lat, geo.lng));
        })
        .catch(() => [] as GeoEventData[]),
    ]);

    return dedupeById([...airports, ...geonames]);
  } catch (e) {
    console.error('Failed to fetch geo events', e);
    return [];
  }
}
