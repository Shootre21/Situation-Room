import React from 'react';
import { Plane, Ship, Satellite, Mountain, Zap, ShieldAlert, CloudRain } from 'lucide-react';
import { LayerState } from '../types';

interface SidebarLeftProps {
  layers: LayerState;
  setLayers: React.Dispatch<React.SetStateAction<LayerState>>;
}

export default function SidebarLeft({ layers, setLayers }: SidebarLeftProps) {
  const toggleLayer = (key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const layerConfig = [
    { key: 'flights', label: 'Aircraft Layer', icon: Plane, color: 'text-cyan-400' },
    { key: 'maritime', label: 'Maritime Layer', icon: Ship, color: 'text-yellow-400' },
    { key: 'satellites', label: 'Satellite Layer', icon: Satellite, color: 'text-fuchsia-400' },
    { key: 'geological', label: 'Geological Layer', icon: Mountain, color: 'text-orange-400' },
    { key: 'infrastructure', label: 'Infrastructure', icon: Zap, color: 'text-blue-400' },
    { key: 'conflict', label: 'Conflict Zones', icon: ShieldAlert, color: 'text-red-500' },
    { key: 'weather', label: 'Weather Systems', icon: CloudRain, color: 'text-gray-300' },
  ];

  return (
    <div className="absolute left-4 top-20 bottom-24 w-72 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col z-10 text-white shadow-2xl">
      <h2 className="text-lg font-mono font-bold mb-4 tracking-wider uppercase text-gray-300 border-b border-white/10 pb-2">Layer Controls</h2>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {layerConfig.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => toggleLayer(key as keyof LayerState)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border ${
              layers[key as keyof LayerState] 
                ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                : 'bg-transparent border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`w-5 h-5 ${layers[key as keyof LayerState] ? color : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${layers[key as keyof LayerState] ? 'text-white' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors duration-300 relative ${
              layers[key as keyof LayerState] ? 'bg-emerald-500' : 'bg-gray-700'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${
                layers[key as keyof LayerState] ? 'transform translate-x-4' : ''
              }`} />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <h3 className="text-xs font-mono text-gray-500 uppercase mb-2">Filters</h3>
        <div className="space-y-2">
          <input type="text" placeholder="Search callsign, ship ID..." className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500" />
        </div>
      </div>
    </div>
  );
}
