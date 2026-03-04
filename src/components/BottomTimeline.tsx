import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export default function BottomTimeline() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(100);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-md border-t border-white/10 z-20 flex flex-col justify-center px-8 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <SkipBack className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 transition-colors text-black"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <SkipForward className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-cyan-400 ml-4 border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 rounded">
            LIVE
          </span>
        </div>
        
        <div className="text-xs font-mono text-gray-400">
          {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
        </div>
      </div>

      <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden cursor-pointer group">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="absolute top-0 h-full w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 4px)` }}
        />
      </div>
    </div>
  );
}
