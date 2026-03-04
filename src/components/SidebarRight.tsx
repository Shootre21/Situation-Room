import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Alert } from '../types';

interface SidebarRightProps {
  alerts: Alert[];
}

export default function SidebarRight({ alerts }: SidebarRightProps) {
  return (
    <div className="absolute right-4 top-20 bottom-24 w-80 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col z-10 text-white shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-black/80 to-transparent">
        <h2 className="text-lg font-mono font-bold tracking-wider uppercase text-gray-300 flex items-center">
          <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
          Event Alerts
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-lg border ${
              alert.type === 'critical' 
                ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                : alert.type === 'warning'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div className="flex items-start">
              {alert.type === 'critical' && <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />}
              {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />}
              {alert.type === 'info' && <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />}
              
              <div>
                <p className="text-sm font-medium text-gray-200 leading-tight">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {alert.timestamp.toLocaleTimeString()} 
                  {alert.lat && alert.lng && ` • ${alert.lat.toFixed(2)}, ${alert.lng.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
