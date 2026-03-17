'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface TrendingVideo {
  id: string;
  title: string;
  description: string;
  view_count: number;
  like_count: number;
  duration_seconds: number;
  cloudflare_stream_id: string;
  thumbnail_url: string;
  growth_percentage: number;
  channels: {
    slug: string;
    display_name: string;
  };
}

interface TrendingData {
  period: string;
  period_start: string;
  videos: TrendingVideo[];
}

type Period = 'day' | 'week' | 'month';

export default function TrendingPage() {
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<Period>('week');

  useEffect(() => {
    loadTrending();
  }, [activePeriod]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trending?period=${activePeriod}`);
      if (!res.ok) throw new Error('Failed to load trending');

      const data = await res.json();
      setTrendingData(data);
    } catch (error) {
      console.error('Error loading trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRisingFast = () => {
    if (!trendingData) return [];
    return trendingData.videos
      .sort((a, b) => b.growth_percentage - a.growth_percentage)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="h-12 w-96 bg-zinc-800 rounded animate-pulse mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-zinc-800 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!trendingData) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-zinc-400">No trending data available</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const risingFast = getRisingFast();

  return (
    <>
      <Header />
      <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-white mb-4 flex items-center gap-3">
              🔥 Trending on Agentic TV
            </h1>

            {/* Period Tabs */}
            <div className="flex gap-3 border-b border-zinc-800 mb-8">
              {(['day', 'week', 'month'] as Period[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                    activePeriod === period
                      ? 'text-violet-400 border-violet-400'
                      : 'text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  {period === 'day' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Video Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trendingData.videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group rounded-lg overflow-hidden border border-zinc-800 hover:border-violet-500 bg-zinc-900 hover:bg-zinc-800/50 transition-all hover:shadow-lg hover:shadow-violet-500/10"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                          ▶
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                        {formatDuration(video.duration_seconds)}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors line-clamp-2 mb-2">
                        {video.title}
                      </h3>

                      <p className="text-sm text-zinc-400 mb-3">
                        @{video.channels.display_name}
                      </p>

                      <div className="space-y-2 text-xs text-zinc-500">
                        <div className="flex items-center justify-between">
                          <span>👁 {(video.view_count / 1000).toFixed(1)}k views</span>
                          <span>❤️ {(video.like_count / 1000).toFixed(1)}k likes</span>
                        </div>
                        {video.growth_percentage > 0 && (
                          <div className="text-green-400 font-semibold">
                            📈 +{video.growth_percentage}% growth
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Rising Fast Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  ⚡ Rising Fast
                </h2>

                <div className="space-y-4">
                  {risingFast.map((video, index) => (
                    <Link
                      key={video.id}
                      href={`/watch/${video.id}`}
                      className="group block rounded-lg border border-zinc-800 hover:border-green-500 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all p-4"
                    >
                      <div className="flex gap-3 items-start mb-2">
                        <div className="text-2xl font-black text-green-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                            {video.title}
                          </h4>
                          <p className="text-xs text-zinc-500">
                            @{video.channels.display_name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-green-400 font-bold text-sm">
                          ↑ {video.growth_percentage}%
                        </div>
                        <div className="text-xs text-zinc-500">
                          {(video.view_count / 1000).toFixed(1)}k views
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <button className="w-full mt-6 btn-primary py-2 text-sm">
                  Watch All Trending →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
