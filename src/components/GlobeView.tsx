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

export default function GlobeView({ autoRotate, layers, flights, earthquakes, satellites, maritime, weather, geoEvents }: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods>();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

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
      globeRef.current.pointOfView({ altitude: 2.5 });
    }
  }, [autoRotate]);

  const pointsData = useMemo(() => {
    let data: any[] = [];

    if (layers.flights) {
      data = data.concat(flights.map(f => ({
        lat: f.lat,
        lng: f.lng,
        size: 0.1,
        color: '#00ffff',
        type: 'flight',
        name: f.callsign,
        detail: `${Math.round(f.alt)}m • ${Math.round(f.velocity)}m/s`,
      })));
    }

    if (layers.satellites) {
      data = data.concat(satellites.map(s => ({
        lat: s.lat,
        lng: s.lng,
        size: 0.13,
        color: '#ff00ff',
        type: 'satellite',
        name: s.name,
        altitude: s.alt,
      })));
    }

    if (layers.maritime) {
      data = data.concat(maritime.map(m => ({
        lat: m.lat,
        lng: m.lng,
        size: 0.07,
        color: '#ffff00',
        type: 'maritime',
        name: m.id,
        detail: `${m.type} • ${m.speed}kt${m.waveHeight ? ` • waves ${m.waveHeight}m` : ''}`,
      })));
    }

    if (layers.weather) {
      data = data.concat(weather.map(w => ({
        lat: w.lat,
        lng: w.lng,
        size: 0.2,
        color: w.windSpeedKph >= 50 ? '#ef4444' : '#60a5fa',
        type: 'weather',
        name: w.label,
        detail: `${w.temperatureC}°C • ${w.windSpeedKph} km/h`,
      })));
    }

    if (layers.infrastructure) {
      data = data.concat(geoEvents.map(g => ({
        lat: g.lat,
        lng: g.lng,
        size: 0.04,
        color: '#22c55e',
        type: 'geo',
        name: g.name,
        detail: g.category,
      })));
    }

    return data;
  }, [layers, flights, satellites, maritime, weather, geoEvents]);

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

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
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
