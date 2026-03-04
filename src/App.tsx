/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import GlobeView from './components/GlobeView';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import TopBar from './components/TopBar';
import BottomTimeline from './components/BottomTimeline';
import { LayerState, FlightData, EarthquakeData, SatelliteData, MaritimeData, WeatherData, GeoEventData, Alert, GlobalStats } from './types';
import { fetchEarthquakes, fetchFlights, fetchSatellites, fetchMaritime, fetchWeather, fetchGeoEvents } from './services/dataService';

interface DataSnapshot {
  timestamp: number;
  flights: FlightData[];
  earthquakes: EarthquakeData[];
  satellites: SatelliteData[];
  maritime: MaritimeData[];
  weather: WeatherData[];
  geoEvents: GeoEventData[];
}

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
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [geoEvents, setGeoEvents] = useState<GeoEventData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [globeSpinning, setGlobeSpinning] = useState(true);

  const [history, setHistory] = useState<DataSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(true);

  const stats: GlobalStats = {
    activeFlights: flights.length,
    activeShips: maritime.length,
    satellitesTracked: satellites.length,
    recentEarthquakes: earthquakes.length,
  };

  useEffect(() => {
    const buildAlerts = (eqData: EarthquakeData[], wxData: WeatherData[]): Alert[] => {
      const newAlerts: Alert[] = [];

      eqData.filter(eq => eq.mag >= 5.0).forEach(eq => {
        newAlerts.push({
          id: `alert-eq-${eq.id}`,
          type: eq.mag >= 6.0 ? 'critical' : 'warning',
          message: `Magnitude ${eq.mag} Earthquake: ${eq.title}`,
          timestamp: new Date(eq.time),
          lat: eq.lat,
          lng: eq.lng,
        });
      });

      wxData
        .filter(w => w.source?.includes('NOAA'))
        .slice(0, 3)
        .forEach(w => {
          newAlerts.push({
            id: `alert-wx-${w.id}`,
            type: 'warning',
            message: `NOAA alert active: ${w.label}`,
            timestamp: new Date(),
            lat: w.lat,
            lng: w.lng,
          });
        });

      newAlerts.push({
        id: 'alert-sys-1',
        type: 'info',
        message: 'Integrated feeds online: OpenSky, Open-Meteo, NOAA Weather, NOAA Tides, USGS, CelesTrak, GeoNames.',
        timestamp: new Date(),
      });

      return newAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    const loadData = async (targetTime = Date.now()) => {
      const [eqData, flData, satData, marData, wxData, geoData] = await Promise.all([
        fetchEarthquakes(targetTime),
        fetchFlights(),
        fetchSatellites(),
        fetchMaritime(),
        fetchWeather(targetTime),
        fetchGeoEvents(),
      ]);

      const snapshot: DataSnapshot = {
        timestamp: targetTime,
        flights: flData,
        earthquakes: eqData,
        satellites: satData,
        maritime: marData,
        weather: wxData,
        geoEvents: geoData,
      };

      if (isLiveMode) {
        setFlights(flData);
        setEarthquakes(eqData);
        setSatellites(satData);
        setMaritime(marData);
        setWeather(wxData);
        setGeoEvents(geoData);
        setAlerts(buildAlerts(eqData, wxData));
      }

      setHistory(prev => {
        const next = [...prev, snapshot].slice(-48);
        if (isLiveMode) {
          setHistoryIndex(next.length - 1);
        }
        return next;
      });
    };

    loadData();

    const interval = setInterval(() => {
      if (isLiveMode) {
        loadData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  useEffect(() => {
    if (!isTimelinePlaying || isLiveMode || history.length < 2) return;

    const timer = setInterval(() => {
      setHistoryIndex(prev => (prev + 1) % history.length);
    }, 1200);

    return () => clearInterval(timer);
  }, [isTimelinePlaying, isLiveMode, history.length]);

  useEffect(() => {
    if (isLiveMode || history.length === 0) return;
    const snap = history[Math.min(historyIndex, history.length - 1)];
    if (!snap) return;
    setFlights(snap.flights);
    setEarthquakes(snap.earthquakes);
    setSatellites(snap.satellites);
    setMaritime(snap.maritime);
    setWeather(snap.weather);
    setGeoEvents(snap.geoEvents);
  }, [history, historyIndex, isLiveMode]);


  useEffect(() => {
    if (!isLiveMode || history.length === 0) return;
    const latest = history[history.length - 1];
    setHistoryIndex(history.length - 1);
    setFlights(latest.flights);
    setEarthquakes(latest.earthquakes);
    setSatellites(latest.satellites);
    setMaritime(latest.maritime);
    setWeather(latest.weather);
    setGeoEvents(latest.geoEvents);
  }, [isLiveMode, history]);

  const progress = useMemo(() => {
    if (history.length <= 1) return 100;
    return Math.round((historyIndex / (history.length - 1)) * 100);
  }, [history.length, historyIndex]);

  const selectedTime = useMemo(() => {
    if (isLiveMode || history.length === 0) return new Date();
    return new Date(history[Math.min(historyIndex, history.length - 1)].timestamp);
  }, [history, historyIndex, isLiveMode]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      <GlobeView
        autoRotate={globeSpinning}
        layers={layers}
        flights={flights}
        earthquakes={earthquakes}
        satellites={satellites}
        maritime={maritime}
        weather={weather}
        geoEvents={geoEvents}
      />

      <TopBar
        stats={stats}
        globeSpinning={globeSpinning}
        onToggleGlobeSpin={() => setGlobeSpinning(prev => !prev)}
      />
      <SidebarLeft layers={layers} setLayers={setLayers} />
      <SidebarRight alerts={alerts} />
      <BottomTimeline
        isPlaying={isTimelinePlaying}
        isLiveMode={isLiveMode}
        progress={progress}
        selectedTime={selectedTime}
        onTogglePlay={() => setIsTimelinePlaying(prev => !prev)}
        onToggleLiveMode={() => setIsLiveMode(prev => !prev)}
        onStepBack={() => {
          setIsLiveMode(false);
          setHistoryIndex(prev => Math.max(prev - 1, 0));
        }}
        onStepForward={() => {
          setIsLiveMode(false);
          setHistoryIndex(prev => Math.min(prev + 1, Math.max(history.length - 1, 0)));
        }}
        onSeek={(value) => {
          setIsLiveMode(false);
          if (history.length <= 1) {
            setHistoryIndex(0);
            return;
          }
          const nextIndex = Math.round((value / 100) * (history.length - 1));
          setHistoryIndex(nextIndex);
        }}
      />
    </div>
  );
}
