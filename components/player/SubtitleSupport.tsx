'use client';

import { useState } from 'react';

interface SubtitleSupportProps {
  subtitleUrl?: string;
  videoElementRef?: React.RefObject<HTMLVideoElement>;
}

export function SubtitleSupport({ subtitleUrl, videoElementRef }: SubtitleSupportProps) {
  const [showSubtitles, setShowSubtitles] = useState(true);

  const handleToggleSubtitles = () => {
    if (videoElementRef?.current) {
      const tracks = videoElementRef.current.querySelectorAll('track');
      tracks.forEach((track) => {
        track.track.mode = showSubtitles ? 'hidden' : 'showing';
      });
    }
    setShowSubtitles(!showSubtitles);
  };

  if (!subtitleUrl) {
    return null;
  }

  return (
    <button
      onClick={handleToggleSubtitles}
      className="px-3 py-1 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
      title={showSubtitles ? 'Subtitles on' : 'Subtitles off'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
      </svg>
      {showSubtitles ? 'CC' : 'CC'}
    </button>
  );
}
