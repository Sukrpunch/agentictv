'use client';

import { useState, useEffect } from 'react';
import { Chapter, parseChapters, getCurrentChapter } from '@/lib/video-utils';

interface VideoChaptersProps {
  description?: string;
  currentTime?: number;
  onSeek?: (timeSeconds: number) => void;
}

export function VideoChapters({ description, currentTime = 0, onSeek }: VideoChaptersProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (description) {
      const parsed = parseChapters(description);
      setChapters(parsed);
    }
  }, [description]);

  useEffect(() => {
    if (chapters.length > 0) {
      const current = getCurrentChapter(chapters, currentTime);
      setCurrentChapter(current);
    }
  }, [currentTime, chapters]);

  if (chapters.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-zinc-900 rounded-lg p-4">
      <h3 className="font-semibold text-white mb-3 text-sm">Chapters</h3>

      <div className="space-y-2">
        {chapters.map((chapter, idx) => (
          <button
            key={idx}
            onClick={() => onSeek?.(chapter.timeSeconds)}
            className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
              currentChapter?.timeSeconds === chapter.timeSeconds
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs min-w-fit">{chapter.timeDisplay}</span>
              <span className="truncate">{chapter.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
