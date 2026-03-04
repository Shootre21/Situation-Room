import React from 'react';
import { GlobalStats } from '../types';
import { Globe, Activity, Plane, Ship, Satellite } from 'lucide-react';

interface TopBarProps {
  stats: GlobalStats;
}

export default function TopBar({ stats }: TopBarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-20 flex items-center justify-between px-6 text-white shadow-lg">
      <div className="flex items-center space-x-3">
        <Globe className="w-6 h-6 text-cyan-500 animate-pulse" />
        <h1 className="text-xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          GLOBAL SITUATIONAL AWARENESS
        </h1>
      </div>

      <div className="flex space-x-8">
        <StatItem icon={Plane} label="Flights" value={stats.activeFlights} color="text-cyan-400" />
        <StatItem icon={Ship} label="Vessels" value={stats.activeShips} color="text-yellow-400" />
        <StatItem icon={Satellite} label="Satellites" value={stats.satellitesTracked} color="text-fuchsia-400" />
        <StatItem icon={Activity} label="Earthquakes" value={stats.recentEarthquakes} color="text-orange-400" />
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`p-1.5 rounded-md bg-white/5 border border-white/10 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold font-mono leading-none">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}
