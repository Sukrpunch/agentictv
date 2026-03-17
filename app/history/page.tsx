'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { getSupabase } from '@/lib/supabase';
import { Video, Channel } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface HistoryItem {
  id: string;
  watch_seconds: number;
  watched_at: string;
  videos: Video & { channel?: Channel };
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setAuthenticated(true);
      await fetchHistory();
    }

    checkAuthAndFetch();
  }, [router]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const session = await getSupabase().auth.getSession();
      const token = session.data.session?.access_token || '';

      const response = await fetch('/api/history', {
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    if (!confirm('Are you sure you want to clear your entire watch history?')) {
      return;
    }

    try {
      const session = await getSupabase().auth.getSession();
      const token = session.data.session?.access_token || '';

      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  // Separate into continue watching and full history
  const continueWatching = history.filter((item) => {
    const video = item.videos;
    const duration = video.duration_seconds || 0;
    return item.watch_seconds > 0 && item.watch_seconds < duration * 0.9;
  });

  const watchedVideos = history.filter((item) => {
    const video = item.videos;
    const duration = video.duration_seconds || 0;
    return item.watch_seconds === 0 || item.watch_seconds >= duration * 0.9;
  });

  if (!authenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen px-6 py-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Watch History</h1>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors text-sm"
              >
                Clear History
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-zinc-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No watch history yet</p>
            </div>
          ) : (
            <>
              {/* Continue Watching */}
              {continueWatching.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-xl font-semibold text-white mb-4">Continue Watching</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {continueWatching.map((item) => (
                      <div key={item.id} className="group relative">
                        <VideoCard video={item.videos} />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700 group-hover:bg-zinc-600">
                          <div
                            className="h-full bg-violet-600"
                            style={{
                              width: `${
                                ((item.watch_seconds /
                                  (item.videos.duration_seconds || 1)) *
                                  100) ??
                                0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Watch History */}
              {watchedVideos.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Watch History</h2>
                  <div className="space-y-3">
                    {watchedVideos.map((item) => (
                      <a
                        key={item.id}
                        href={`/watch/${item.videos.id}`}
                        className="flex gap-4 p-4 bg-zinc-900 hover:bg-zinc-800 rounded transition-colors group"
                      >
                        <div className="relative w-32 h-20 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
                          {item.videos.thumbnail_url && (
                            <img
                              src={item.videos.thumbnail_url}
                              alt={item.videos.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                          {item.videos.cloudflare_stream_id && !item.videos.thumbnail_url && (
                            <img
                              src={`https://videodelivery.net/${item.videos.cloudflare_stream_id}/thumbnails/thumbnail.jpg`}
                              alt={item.videos.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate group-hover:text-violet-400 transition-colors">
                            {item.videos.title}
                          </h3>
                          <p className="text-sm text-zinc-400 mt-1">Watched {formatDate(item.watched_at)}</p>
                          <p className="text-xs text-zinc-500 mt-2">
                            {item.videos.view_count.toLocaleString()} views
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
