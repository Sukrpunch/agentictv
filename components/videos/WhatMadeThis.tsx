'use client';

import { useState, useEffect } from 'react';

interface Tool {
  name: string;
  version: string;
  role: string;
}

interface VideoCredits {
  id: string;
  video_id: string;
  tools: Tool[];
  prompt: string | null;
  notes: string | null;
  show_prompt: boolean;
  created_at: string;
  updated_at: string;
}

interface WhatMadeThisProps {
  videoId: string;
}

const toolEmojis: { [key: string]: string } = {
  runway: '🎬',
  suno: '🎵',
  midjourney: '🎨',
  'stable diffusion': '🎨',
  'elevenlabs': '🎙️',
  openai: '🤖',
  claude: '🤖',
  default: '⚙️',
};

function getToolEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(toolEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return toolEmojis.default;
}

export function WhatMadeThis({ videoId }: WhatMadeThisProps) {
  const [credits, setCredits] = useState<VideoCredits | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch(`/api/videos/${videoId}/credits`);
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
        }
      } catch (err) {
        console.error('Error fetching credits:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, [videoId]);

  if (loading) {
    return null;
  }

  if (!credits || (!credits.tools?.length && !credits.prompt && !credits.notes)) {
    return (
      <div className="mt-6 bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
        <p className="text-sm text-zinc-400">
          Creator hasn't shared their process yet
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-violet-400 transition-colors"
      >
        <span>⚙️ What Made This</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 space-y-4">
          {/* Tools */}
          {credits.tools && credits.tools.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Tools Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {credits.tools.map((tool, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700/50 border border-zinc-600 rounded-full text-xs text-zinc-200"
                  >
                    <span>{getToolEmoji(tool.name)}</span>
                    <span>
                      {tool.name}
                      {tool.version && ` v${tool.version}`}
                    </span>
                    {tool.role && (
                      <span className="text-zinc-400">— {tool.role}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt */}
          {credits.show_prompt && credits.prompt && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Prompt
              </h4>
              <p className="text-sm text-zinc-300 bg-zinc-900/50 rounded p-3 font-mono whitespace-pre-wrap break-words">
                {credits.prompt}
              </p>
            </div>
          )}

          {/* Notes */}
          {credits.notes && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Process Notes
              </h4>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
                {credits.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
