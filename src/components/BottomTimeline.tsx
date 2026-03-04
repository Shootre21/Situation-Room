import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Radio } from 'lucide-react';

interface BottomTimelineProps {
  isPlaying: boolean;
  isLiveMode: boolean;
  progress: number;
  selectedTime: Date;
  onTogglePlay: () => void;
  onToggleLiveMode: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSeek: (value: number) => void;
}

export default function BottomTimeline({
  isPlaying,
  isLiveMode,
  progress,
  selectedTime,
  onTogglePlay,
  onToggleLiveMode,
  onStepBack,
  onStepForward,
  onSeek,
}: BottomTimelineProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-md border-t border-white/10 z-20 flex flex-col justify-center px-8 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <button onClick={onStepBack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 transition-colors text-black"
            title={isPlaying ? 'Pause playback' : 'Play timeline'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button onClick={onStepForward} className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleLiveMode}
            className={`text-xs font-mono ml-4 border px-2 py-1 rounded inline-flex items-center gap-1 ${
              isLiveMode ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10' : 'text-gray-300 border-white/20 bg-white/5'
            }`}
          >
            <Radio className={`w-3 h-3 ${isLiveMode ? 'text-cyan-400' : 'text-gray-400'}`} />
            {isLiveMode ? 'LIVE' : 'PLAYBACK'}
          </button>
        </div>

        <div className="text-xs font-mono text-gray-300">
          {selectedTime.toISOString().replace('T', ' ').substring(0, 19)} UTC
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={progress}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full h-2 accent-cyan-500 bg-gray-800 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
