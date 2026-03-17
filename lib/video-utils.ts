/**
 * Utility functions for video features
 */

export interface Chapter {
  timeSeconds: number;
  title: string;
  timeDisplay: string;
}

/**
 * Parse chapters from video description
 * Looks for timestamps like: 0:00 Introduction, 1:23 The Build, etc.
 */
export function parseChapters(description: string): Chapter[] {
  if (!description) return [];

  const regex = /^(\d+):(\d{2})(?::(\d{2}))?\s+(.+)$/gm;
  const chapters: Chapter[] = [];
  let match;

  while ((match = regex.exec(description)) !== null) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const title = match[4].trim();

    const timeSeconds = hours * 3600 + minutes * 60 + seconds;
    const timeDisplay = `${hours ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    chapters.push({
      timeSeconds,
      title,
      timeDisplay,
    });
  }

  return chapters;
}

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get current chapter based on video time
 */
export function getCurrentChapter(chapters: Chapter[], currentTime: number): Chapter | null {
  if (chapters.length === 0) return null;

  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].timeSeconds) {
      return chapters[i];
    }
  }

  return null;
}

/**
 * Playback speed options
 */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Get stored playback speed preference from localStorage
 */
export function getPlaybackSpeed(): number {
  if (typeof window === 'undefined') return 1;
  const stored = localStorage.getItem('atv_playback_speed');
  const speed = stored ? parseFloat(stored) : 1;
  return PLAYBACK_SPEEDS.includes(speed) ? speed : 1;
}

/**
 * Save playback speed preference to localStorage
 */
export function setPlaybackSpeed(speed: number): void {
  if (typeof window === 'undefined') return;
  if (PLAYBACK_SPEEDS.includes(speed)) {
    localStorage.setItem('atv_playback_speed', String(speed));
  }
}

/**
 * Set playback speed on Cloudflare Stream player
 */
export function setStreamPlaybackSpeed(playerElement: HTMLElement | null, speed: number): void {
  if (!playerElement) return;

  const stream = playerElement as any;
  if (stream && typeof stream.playbackRate === 'number') {
    stream.playbackRate = speed;
  }
}
