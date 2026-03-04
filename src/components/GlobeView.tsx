import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LayerState, FlightData, EarthquakeData, SatelliteData, MaritimeData } from '../types';

interface GlobeViewProps {
  layers: LayerState;
  flights: FlightData[];
  earthquakes: EarthquakeData[];
  satellites: SatelliteData[];
  maritime: MaritimeData[];
}

export default function GlobeView({ layers, flights, earthquakes, satellites, maritime }: GlobeViewProps) {
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
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ altitude: 2.5 });
    }
  }, []);

  // Data processing for globe layers
  const pointsData = useMemo(() => {
    let data: any[] = [];
    if (layers.flights) {
      data = data.concat(flights.map(f => ({
        lat: f.lat,
        lng: f.lng,
        size: 0.1,
        color: '#00ffff',
        type: 'flight',
        name: f.callsign
      })));
    }
    if (layers.satellites) {
      data = data.concat(satellites.map(s => ({
        lat: s.lat,
        lng: s.lng,
        size: 0.15,
        color: '#ff00ff',
        type: 'satellite',
        name: s.name,
        altitude: s.alt / 6371 // Approximate altitude relative to earth radius
      })));
    }
    if (layers.maritime) {
      data = data.concat(maritime.map(m => ({
        lat: m.lat,
        lng: m.lng,
        size: 0.05,
        color: m.type === 'Military' ? '#ff4444' : '#ffff00',
        type: 'maritime',
        name: m.type
      })));
    }
    return data;
  }, [layers, flights, satellites, maritime]);

  const ringsData = useMemo(() => {
    if (!layers.geological) return [];
    return earthquakes.map(eq => ({
      lat: eq.lat,
      lng: eq.lng,
      maxR: eq.mag * 2,
      propagationSpeed: 1,
      repeatPeriod: 1000,
      color: eq.mag > 5 ? '#ff0000' : '#ffa500'
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
