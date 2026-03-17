'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Creator {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface Video {
  id: string;
  title: string;
  cloudflare_stream_id: string;
}

interface Prompt {
  id: string;
  prompt: string;
  tool: string;
  tool_version?: string;
  genre?: string;
  tags: string[];
  use_count: number;
  creator: Creator;
  video: Video;
  created_at: string;
}

const tools = ['Runway', 'Sora', 'Kling', 'Pika', 'Midjourney'];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        let url = '/api/prompts?limit=100';
        if (selectedTool !== 'all') {
          url += `&tool=${selectedTool}`;
        }
        if (searchQuery) {
          url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setPrompts(data.prompts || []);
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetchPrompts();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedTool, searchQuery]);

  const handleCopyPrompt = (prompt: string, promptId: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getThumbnailUrl = (cloudflareStreamId: string) => {
    return `https://videodelivery.net/${cloudflareStreamId}/thumbnails/thumbnail.jpg`;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 flex items-center gap-3">
              <span className="text-3xl">📝</span> Prompt Archive
            </h1>
            <p className="text-xl text-zinc-400">
              The collective knowledge of AI video creation. Browse thousands of prompts from creators worldwide.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search prompts by description, genre, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-600 transition-colors"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tool filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTool('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTool === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                All Tools
              </button>
              {tools.map((tool) => (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedTool === tool
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Prompts Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">Loading prompts...</p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No prompts found. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-violet-500/10 group bg-zinc-900"
                >
                  {/* Video thumbnail */}
                  {prompt.video && (
                    <div className="relative bg-black h-40 overflow-hidden">
                      <img
                        src={getThumbnailUrl(prompt.video.cloudflare_stream_id)}
                        alt={prompt.video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Tool badge */}
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-violet-600/20 text-violet-400">
                        🎬 {prompt.tool}
                      </span>
                    </div>

                    {/* Prompt text */}
                    <p className="text-sm text-zinc-300 mb-4 line-clamp-3 leading-relaxed">
                      "{prompt.prompt}"
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {prompt.genre && (
                        <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                          {prompt.genre}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                        Used {prompt.use_count} times
                      </span>
                    </div>

                    {/* Creator info */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-t border-zinc-800">
                      <div className="text-xs text-zinc-400">
                        by <span className="text-zinc-300 font-medium">@{prompt.creator.display_name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyPrompt(prompt.prompt, prompt.id)}
                        className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                          copiedId === prompt.id
                            ? 'bg-green-600 text-white'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                      >
                        {copiedId === prompt.id ? '✓ Copied' : 'Copy'}
                      </button>
                      <button className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold">
                        Use →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info section */}
          <div className="mt-16 p-8 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="text-xl font-bold mb-3">💡 Share Your Prompts</h3>
            <p className="text-zinc-300 mb-3">
              When you upload a video, you can share the AI tool prompt you used. Help other creators discover great techniques and accelerate the evolution of AI video generation.
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
            >
              Upload Video & Share Prompt →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
