/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import GlobeView from './components/GlobeView';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import TopBar from './components/TopBar';
import BottomTimeline from './components/BottomTimeline';
import { LayerState, FlightData, EarthquakeData, SatelliteData, MaritimeData, Alert, GlobalStats } from './types';
import { fetchEarthquakes, fetchFlights, fetchSatellites, fetchMaritime } from './services/dataService';

export default function App() {
  const [layers, setLayers] = useState<LayerState>({
    flights: true,
    maritime: true,
    satellites: false,
    geological: true,
    infrastructure: false,
    conflict: false,
    weather: false,
  });

  const [flights, setFlights] = useState<FlightData[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [maritime, setMaritime] = useState<MaritimeData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const stats: GlobalStats = {
    activeFlights: flights.length,
    activeShips: maritime.length,
    satellitesTracked: satellites.length,
    recentEarthquakes: earthquakes.length,
  };

  useEffect(() => {
    // Initial data load
    const loadData = async () => {
      const [eqData, flData] = await Promise.all([
        fetchEarthquakes(),
        fetchFlights()
      ]);
      setEarthquakes(eqData);
      setFlights(flData);
      setSatellites(fetchSatellites());
      setMaritime(fetchMaritime());

      // Generate some initial alerts based on data
      const newAlerts: Alert[] = [];
      
      const significantEqs = eqData.filter(eq => eq.mag >= 5.0);
      significantEqs.forEach(eq => {
        newAlerts.push({
          id: `alert-eq-${eq.id}`,
          type: eq.mag >= 6.0 ? 'critical' : 'warning',
          message: `Magnitude ${eq.mag} Earthquake: ${eq.title}`,
          timestamp: new Date(eq.time),
          lat: eq.lat,
          lng: eq.lng
        });
      });

      newAlerts.push({
        id: 'alert-sys-1',
        type: 'info',
        message: 'Global Situational Awareness Platform initialized. Data feeds active.',
        timestamp: new Date()
      });

      setAlerts(newAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    };

    loadData();

    // Set up polling for live updates
    const interval = setInterval(async () => {
      const flData = await fetchFlights();
      setFlights(flData);
      
      // Simulate movement for mock data
      setSatellites(prev => prev.map(s => ({
        ...s,
        lng: s.lng + 0.5 > 180 ? -180 : s.lng + 0.5
      })));
      
      setMaritime(prev => prev.map(m => ({
        ...m,
        lat: m.lat + (Math.random() - 0.5) * 0.1,
        lng: m.lng + (Math.random() - 0.5) * 0.1
      })));
      
    }, 10000); // 10s updates

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      <GlobeView 
        layers={layers}
        flights={flights}
        earthquakes={earthquakes}
        satellites={satellites}
        maritime={maritime}
      />
      
      <TopBar stats={stats} />
      <SidebarLeft layers={layers} setLayers={setLayers} />
      <SidebarRight alerts={alerts} />
      <BottomTimeline />
    </div>
  );
}
