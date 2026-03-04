import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LayerState, FlightData, EarthquakeData, SatelliteData, MaritimeData, WeatherData, GeoEventData } from '../types';

interface GlobeViewProps {
  autoRotate: boolean;
  layers: LayerState;
  flights: FlightData[];
  earthquakes: EarthquakeData[];
  satellites: SatelliteData[];
  maritime: MaritimeData[];
  weather: WeatherData[];
  geoEvents: GeoEventData[];
}

const KM_PER_DEG_LAT = 111.32;

function normalizeLongitude(lng: number): number {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}

function projectMotion(lat: number, lng: number, headingDeg: number, kmPerSec: number, elapsedSec: number) {
  if (!Number.isFinite(kmPerSec) || kmPerSec <= 0 || elapsedSec <= 0) return { lat, lng };
  const heading = (headingDeg * Math.PI) / 180;
  const distKm = kmPerSec * elapsedSec;
  const deltaLat = (distKm * Math.cos(heading)) / KM_PER_DEG_LAT;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.15);
  const deltaLng = (distKm * Math.sin(heading)) / (KM_PER_DEG_LAT * cosLat);

  return {
    lat: Math.max(-85, Math.min(85, lat + deltaLat)),
    lng: normalizeLongitude(lng + deltaLng),
  };
}

export default function GlobeView({ autoRotate, layers, flights, earthquakes, satellites, maritime, weather, geoEvents }: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods>();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [frameTime, setFrameTime] = useState(Date.now());

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = autoRotate;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ altitude: 2.3 });
    }
  }, [autoRotate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pointsData = useMemo(() => {
    let data: any[] = [];

    if (layers.flights) {
      data = data.concat(
        flights.map(f => {
          const elapsedSec = Math.max(0, (frameTime - (f.fetchedAt || frameTime)) / 1000);
          const kmPerSec = (f.velocity || 0) / 1000;
          const motion = projectMotion(f.lat, f.lng, f.heading || 0, kmPerSec, elapsedSec);

          return {
            lat: motion.lat,
            lng: motion.lng,
            size: 0.09,
            color: '#52d3ff',
            type: 'flight',
            name: f.callsign,
            detail: `${Math.round(f.alt)}m • ${Math.round(f.velocity)}m/s • ${f.source || 'live'}`,
          };
        })
      );
    }

    if (layers.satellites) {
      data = data.concat(
        satellites.map(s => {
          const elapsedSec = Math.max(0, (frameTime - (s.fetchedAt || frameTime)) / 1000);
          const meanMotion = s.meanMotion || 15;
          const orbitalDegPerSec = (meanMotion * 360) / 86400;
          const nextLng = normalizeLongitude(s.lng + orbitalDegPerSec * elapsedSec);
          const inc = s.inclination || 0;
          const latOsc = Math.sin(((nextLng + 180) * Math.PI) / 180) * Math.min(inc, 30);

          return {
            lat: s.orbitClass === 'geosynchronous' ? s.lat : latOsc,
            lng: nextLng,
            size: s.orbitClass === 'geosynchronous' ? 0.15 : 0.12,
            color: s.orbitClass === 'geosynchronous' ? '#22c55e' : '#ff00ff',
            type: 'satellite',
            name: s.name,
            altitude: s.alt,
            detail: `${s.orbitClass === 'geosynchronous' ? 'GEO' : 'LEO/MEO'} • ${meanMotion.toFixed(2)} rev/day`,
          };
        })
      );
    }

    if (layers.maritime) {
      data = data.concat(
        maritime.map(m => {
          const elapsedSec = Math.max(0, (frameTime - (m.fetchedAt || frameTime)) / 1000);
          const kmPerSec = (m.speed || 0) * 0.000514444;
          const motion = projectMotion(m.lat, m.lng, m.heading || 0, kmPerSec, elapsedSec);

          return {
            lat: motion.lat,
            lng: motion.lng,
            size: 0.065,
            color: '#fde047',
            type: 'maritime',
            name: m.id,
            detail: `${m.type} • ${m.speed}kt${m.waveHeight ? ` • waves ${m.waveHeight}m` : ''} • ${m.source || 'live'}`,
          };
        })
      );
    }

    if (layers.weather) {
      data = data.concat(
        weather.map(w => ({
          lat: w.lat,
          lng: w.lng,
          size: 0.2,
          color: w.windSpeedKph >= 50 ? '#ef4444' : '#60a5fa',
          type: 'weather',
          name: w.label,
          detail: `${w.temperatureC}°C • ${w.windSpeedKph} km/h • ${w.source || 'live'}`,
        }))
      );
    }

    if (layers.infrastructure) {
      data = data.concat(
        geoEvents.map(g => ({
          lat: g.lat,
          lng: g.lng,
          size: 0.04,
          color: '#22c55e',
          type: 'geo',
          name: g.name,
          detail: `${g.category} • ${g.source || 'source'}`,
        }))
      );
    }

    return data;
  }, [layers, flights, satellites, maritime, weather, geoEvents, frameTime]);

  const ringsData = useMemo(() => {
    if (!layers.geological) return [];

    return earthquakes.map(eq => ({
      lat: eq.lat,
      lng: eq.lng,
      maxR: eq.mag * 2,
      propagationSpeed: 1,
      repeatPeriod: 1000,
      color: eq.mag > 5 ? '#ff0000' : '#ffa500',
    }));
  }, [layers.geological, earthquakes]);

  const geoOrbitPaths = useMemo(() => {
    if (!layers.satellites) return [];

    return satellites
      .filter(s => s.orbitClass === 'geosynchronous')
      .slice(0, 16)
      .map((sat, idx) => ({
        id: `geo-orbit-${sat.id}-${idx}`,
        points: Array.from({ length: 73 }, (_, pointIdx) => {
          const lng = -180 + pointIdx * 5;
          const lat = Math.sin(((lng + idx * 10) * Math.PI) / 180) * Math.min((sat.inclination || 0), 5);
          return { lat, lng };
        }),
      }));
  }, [layers.satellites, satellites]);

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        globeTileEngineUrl={(x, y, l) => `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${l}/${y}/${x}`}
        globeTileEngineMaxZoom={8}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pathsData={geoOrbitPaths}
        pathPoints="points"
        pathPointLat="lat"
        pathPointLng="lng"
        pathColor={() => '#22c55e'}
        pathStroke={0.35}
        pathAltitude={0.08}
        pathDashLength={0.5}
        pathDashGap={0.4}
        pathDashAnimateTime={4500}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={d => (d as any).altitude || 0.01}
        pointRadius="size"
        pointLabel={d => `<div style=\"font-family:monospace;\"><b>${(d as any).type?.toUpperCase()}</b><br/>${(d as any).name || ''}<br/>${(d as any).detail || ''}</div>`}
        pointsMerge={true}
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
}
