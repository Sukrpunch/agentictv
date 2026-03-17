'use client';

import { useState, useEffect, useRef } from 'react';
import { PLAYBACK_SPEEDS, getPlaybackSpeed, setPlaybackSpeed, setStreamPlaybackSpeed } from '@/lib/video-utils';

interface PlaybackSpeedControlProps {
  playerRef?: React.RefObject<HTMLElement>;
}

export function PlaybackSpeedControl({ playerRef }: PlaybackSpeedControlProps) {
  const [speed, setSpeed] = useState(1);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize speed from localStorage
  useEffect(() => {
    const savedSpeed = getPlaybackSpeed();
    setSpeed(savedSpeed);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    setPlaybackSpeed(newSpeed);

    if (playerRef?.current) {
      setStreamPlaybackSpeed(playerRef.current, newSpeed);
    }

    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        title="Playback speed"
      >
        {speed}x
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                speed === s
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
