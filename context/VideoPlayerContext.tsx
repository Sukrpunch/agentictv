'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CurrentVideo {
  id: string;
  title: string;
  creator: string;
  cloudflare_video_id: string;
}

interface VideoPlayerContextType {
  currentVideo: CurrentVideo | null;
  isPlaying: boolean;
  showMiniPlayer: boolean;
  play: (video: CurrentVideo) => void;
  setIsPlaying: (playing: boolean) => void;
  showMini: (show: boolean) => void;
  dismiss: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<CurrentVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  const play = useCallback((video: CurrentVideo) => {
    setCurrentVideo(video);
    setIsPlaying(true);
    setShowMiniPlayer(false);
  }, []);

  const showMini = useCallback((show: boolean) => {
    setShowMiniPlayer(show);
  }, []);

  const dismiss = useCallback(() => {
    setCurrentVideo(null);
    setIsPlaying(false);
    setShowMiniPlayer(false);
  }, []);

  return (
    <VideoPlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        showMiniPlayer,
        play,
        setIsPlaying,
        showMini,
        dismiss,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  }
  return context;
}
