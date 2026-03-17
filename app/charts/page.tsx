'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface ChartEntry {
  id: string;
  position: number;
  prev_position?: number;
  video_id: string;
  score: number;
  view_count_week: number;
  like_count_week: number;
  comment_count_week: number;
  tip_count_week: number;
  weeks_on_chart: number;
  is_new_entry: boolean;
  is_bullet: boolean;
  mason_commentary: string;
  thumbnail_url: string;
  videos: {
    title: string;
    duration_seconds: number;
    channels: {
      slug: string;
      display_name: string;
    };
  };
}

interface ChartData {
  week_start: string;
  entries: ChartEntry[];
}

export default function ChartsPage() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [dedicationModal, setDedicationModal] = useState(false);

  useEffect(() => {
    loadChart();
  }, [selectedWeek]);

  const loadChart = async () => {
    setLoading(true);
    try {
      const url = selectedWeek
        ? `/api/charts?week=${selectedWeek}`
        : '/api/charts';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load chart');

      const data = await res.json();
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMovementIndicator = (entry: ChartEntry) => {
    if (entry.is_new_entry) {
      return <span className="text-green-400 font-bold">🆕 NEW</span>;
    }
    if (entry.is_bullet) {
      return <span className="text-pink-400 font-bold">🔥 BULLET</span>;
    }
    if (entry.prev_position) {
      if (entry.prev_position > entry.position) {
        const diff = entry.prev_position - entry.position;
        return <span className="text-green-400 font-bold">⬆️ +{diff}</span>;
      } else if (entry.prev_position < entry.position) {
        const diff = entry.position - entry.prev_position;
        return <span className="text-red-400 font-bold">⬇️ -{diff}</span>;
      }
    }
    return <span className="text-zinc-500">→ STEADY</span>;
  };

  const getPositionColor = (position: number) => {
    if (position <= 5) return 'text-violet-400';
    return 'text-white';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mx-auto mb-4"></div>
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!chartData) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-zinc-400">No chart data available</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-3">
              🎬 The Agentic Charts
            </h1>
            <p className="text-zinc-400 text-lg mb-6">
              Week of {formatDate(chartData.week_start)}
            </p>

            <div className="flex gap-4 items-center flex-wrap">
              <button
                onClick={() => setDedicationModal(true)}
                className="btn-primary px-6 py-2"
              >
                ✉️ Submit a Dedication
              </button>
            </div>
          </div>

          {/* #1 Entry Hero (if exists) */}
          {chartData.entries.length > 0 && (
            <div className="mb-12 rounded-xl overflow-hidden border border-violet-500/50 bg-zinc-900/50 backdrop-blur-xl p-8">
              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-yellow-400 shadow-lg shadow-yellow-400/30">
                    <img
                      src={chartData.entries[0].thumbnail_url}
                      alt={chartData.entries[0].videos.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-yellow-400 text-6xl font-black mb-4">
                    #1 👑
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {chartData.entries[0].videos.title}
                  </h2>
                  <p className="text-violet-400 mb-4">
                    @{chartData.entries[0].videos.channels.display_name}
                  </p>
                  <p className="text-zinc-300 italic text-lg mb-4">
                    "{chartData.entries[0].mason_commentary}"
                  </p>
                  <div className="flex gap-4 items-center text-sm text-zinc-400">
                    <span>👁 {chartData.entries[0].view_count_week.toLocaleString()} views</span>
                    <span>•</span>
                    <span>❤️ {chartData.entries[0].like_count_week.toLocaleString()} likes</span>
                    <span>•</span>
                    <span>{formatDuration(chartData.entries[0].videos.duration_seconds)}</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/watch/${chartData.entries[0].video_id}`}
                      className="btn-primary px-6 py-2 text-sm"
                    >
                      ▶ Watch Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart List (#2-20) */}
          <div className="space-y-3 mb-16">
            {chartData.entries.slice(1).map((entry) => (
              <Link
                key={entry.id}
                href={`/watch/${entry.video_id}`}
                className="group block rounded-lg border border-zinc-800 hover:border-violet-500/50 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all p-4"
              >
                <div className="flex gap-4 items-start">
                  {/* Position */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className={`text-3xl font-black ${getPositionColor(entry.position)}`}>
                      #{entry.position}
                    </div>
                  </div>

                  {/* Movement */}
                  <div className="flex-shrink-0 w-16 text-center">
                    {getMovementIndicator(entry)}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={entry.thumbnail_url}
                      alt={entry.videos.title}
                      className="w-20 h-12 rounded object-cover"
                    />
                  </div>

                  {/* Title & Creator */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors truncate">
                      {entry.videos.title}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      @{entry.videos.channels.display_name} • {formatDuration(entry.videos.duration_seconds)}
                    </p>
                    <p className="text-sm text-zinc-500 italic mt-2">
                      {entry.mason_commentary}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right text-sm">
                    <div className="text-white font-semibold">
                      👁 {entry.view_count_week.toLocaleString()}
                    </div>
                    <div className="text-zinc-500">views</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Featured Dedications Section */}
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <h2 className="text-2xl font-bold text-white mb-6">✨ Featured Dedications</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
                <p className="text-violet-400 font-semibold mb-2">From Alex → To Chris</p>
                <p className="text-white text-sm italic">
                  "Your videos inspire me daily. Keep creating magic!"
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
                <p className="text-violet-400 font-semibold mb-2">From Jordan → To Morgan</p>
                <p className="text-white text-sm italic">
                  "Your #1 ranking is well deserved. The world sees your talent!"
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
                <p className="text-violet-400 font-semibold mb-2">From Sam → To Casey</p>
                <p className="text-white text-sm italic">
                  "The bullet this week! Love watching you climb the charts."
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
