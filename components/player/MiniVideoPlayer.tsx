'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useVideoPlayer } from '@/context/VideoPlayerContext';
import Link from 'next/link';

export function MiniVideoPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentVideo, isPlaying, showMiniPlayer, setIsPlaying, showMini, dismiss } =
    useVideoPlayer();
  const [shouldShow, setShouldShow] = useState(false);

  // Show mini player when navigating away from watch page while video is playing
  useEffect(() => {
    if (currentVideo && isPlaying && !pathname.includes(`/watch/${currentVideo.id}`)) {
      showMini(true);
      setShouldShow(true);
    } else {
      showMini(false);
      setShouldShow(false);
    }
  }, [pathname, currentVideo, isPlaying, showMini]);

  if (!shouldShow || !showMiniPlayer || !currentVideo) {
    return null;
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismiss();
  };

  const handleNavigateToVideo = () => {
    router.push(`/watch/${currentVideo.id}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-700">
        {/* Video Preview */}
        <button
          onClick={handleNavigateToVideo}
          className="w-full relative group cursor-pointer bg-zinc-800 aspect-video flex items-center justify-center overflow-hidden"
        >
          <img
            src={`https://videodelivery.net/${currentVideo.cloudflare_video_id}/thumbnails/thumbnail.jpg`}
            alt={currentVideo.title}
            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </button>

        {/* Info Section */}
        <div className="p-3 border-t border-zinc-700">
          <h3 className="font-semibold text-white text-sm truncate">{currentVideo.title}</h3>
          <p className="text-zinc-400 text-xs mt-0.5">{currentVideo.creator}</p>

          {/* Controls */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handlePlayPause}
              className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.75 1.5A.75.75 0 005 2.25v15.5a.75.75 0 001.5 0V2.25A.75.75 0 005.75 1.5zm8.5 0a.75.75 0 00-.75.75v15.5a.75.75 0 001.5 0V2.25a.75.75 0 00-.75-.75z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Play
                </>
              )}
            </button>

            <button
              onClick={handleClose}
              className="px-3 py-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white text-sm rounded transition-colors flex items-center justify-center"
              title="Close mini player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Click hint */}
          <p className="text-center text-xs text-zinc-500 mt-2">Click video to expand</p>
        </div>
      </div>
    </div>
  );
}
