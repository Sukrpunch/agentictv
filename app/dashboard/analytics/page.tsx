'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';

interface Analytics {
  overview: {
    total_views: number;
    total_views_change: number;
    total_viewers: number;
    total_viewers_change: number;
    total_likes: number;
    total_likes_change: number;
    total_followers: number;
    total_followers_change: number;
    total_tips: number;
    total_tips_change: number;
    total_videos: number;
    avg_watch_time_seconds: number;
    completion_rate: number;
  };
  views_over_time: { date: string; views: number }[];
  top_videos: {
    id: string;
    title: string;
    views: number;
    likes: number;
    tips: number;
    viewers: number;
    watch_time_minutes: number;
    thumbnail_url: string | null;
  }[];
  follower_growth: { date: string; followers: number }[];
  genre_breakdown: { genre: string; count: number; views: number }[];
  recent_activity: {
    type: 'view' | 'like' | 'follow' | 'tip' | 'comment';
    created_at: string;
    actor_username?: string;
    video_title?: string;
  }[];
}

function LineChart({ data, height = 200 }: { data: any[]; height?: number }) {
  if (!data || data.length === 0) return <div className="h-32 bg-zinc-900/50 rounded-lg flex items-center justify-center text-zinc-500">No data</div>;

  // Support both views and followers properties
  const getYValue = (item: any) => item.views !== undefined ? item.views : item.followers;
  const max = Math.max(...data.map((d) => getYValue(d)), 1);
  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - (getYValue(d) / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `M ${points.split(' ').join(' L ')} L 100,100 L 0,100 Z`;

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute">
        {/* Background fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.5" />

        {/* Area fill */}
        <path d={fillPoints} fill="url(#areaGradient)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="#7c3aed" strokeWidth="2" vectorEffect="non-scaling-stroke" />

        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * 100;
          const y = 100 - (d.views / max) * 100;
          return <circle key={i} cx={x} cy={y} r="1" fill="#7c3aed" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
    </div>
  );
}

function StatCard({ label, value, change }: { label: string; value: string | number; change: number }) {
  const isPositive = change >= 0;
  return (
    <div className="card p-6 text-center">
      <p className="text-zinc-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-violet-400 mb-2">{value}</p>
      <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </p>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  const diff = Math.floor((today.getTime() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    async function fetchAnalytics() {
      const supabase = getSupabase();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      try {
        const response = await fetch(`/api/dashboard/analytics?period=${period}`, {
          headers: {
            authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          console.error('Failed to fetch analytics:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }

      setLoading(false);
    }

    fetchAnalytics();
  }, [period, router]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-zinc-800 rounded w-1/3" />
              <div className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-6 h-24 bg-zinc-900" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Creator Analytics</h1>
            <button onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-300">
              ← Back
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-8">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {analytics ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                  label="Views"
                  value={analytics.overview.total_views.toLocaleString()}
                  change={analytics.overview.total_views_change}
                />
                <StatCard
                  label="Viewers"
                  value={analytics.overview.total_viewers.toLocaleString()}
                  change={analytics.overview.total_viewers_change}
                />
                <StatCard
                  label="Likes"
                  value={analytics.overview.total_likes.toLocaleString()}
                  change={analytics.overview.total_likes_change}
                />
                <StatCard
                  label="Followers"
                  value={analytics.overview.total_followers.toLocaleString()}
                  change={analytics.overview.total_followers_change}
                />
                <StatCard
                  label="AGNT Tips"
                  value={analytics.overview.total_tips.toLocaleString()}
                  change={analytics.overview.total_tips_change}
                />
                <StatCard label="Videos" value={analytics.overview.total_videos} change={0} />
              </div>

              {/* Watch Time Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card p-6">
                  <p className="text-zinc-400 text-sm mb-2">Avg Watch Time</p>
                  <p className="text-3xl font-bold text-violet-400">
                    {formatTime(analytics.overview.avg_watch_time_seconds)}
                  </p>
                </div>
                <div className="card p-6">
                  <p className="text-zinc-400 text-sm mb-2">Completion Rate</p>
                  <p className="text-3xl font-bold text-violet-400">{analytics.overview.completion_rate}%</p>
                </div>
                <div className="card p-6">
                  <p className="text-zinc-400 text-sm mb-2">Avg Views/Video</p>
                  <p className="text-3xl font-bold text-violet-400">
                    {analytics.overview.total_videos > 0
                      ? Math.round(analytics.overview.total_views / analytics.overview.total_videos)
                      : 0}
                  </p>
                </div>
              </div>

              {/* Views Over Time Chart */}
              <div className="card p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">Views Over Time</h2>
                <LineChart data={analytics.views_over_time} height={250} />
              </div>

              {/* Top Videos Table */}
              {analytics.top_videos.length > 0 && (
                <div className="card p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Top Videos</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-zinc-800">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Video</th>
                          <th className="text-right py-3 px-4 font-semibold">Views</th>
                          <th className="text-right py-3 px-4 font-semibold">Viewers</th>
                          <th className="text-right py-3 px-4 font-semibold">Watch Time</th>
                          <th className="text-right py-3 px-4 font-semibold">Likes</th>
                          <th className="text-right py-3 px-4 font-semibold">AGNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_videos.map((video, index) => (
                          <tr key={video.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <span className="text-violet-400 font-bold w-6">#{index + 1}</span>
                                {video.thumbnail_url && (
                                  <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-12 h-7 object-cover rounded"
                                  />
                                )}
                                <span className="font-medium truncate">{video.title}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-300">
                              {video.views.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-300">
                              {video.viewers.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-300">
                              {video.watch_time_minutes.toLocaleString()} min
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-300">{video.likes}</td>
                            <td className="py-3 px-4 text-right text-violet-400 font-semibold">
                              {video.tips}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Follower Growth Chart */}
              {analytics.follower_growth.length > 0 && (
                <div className="card p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Follower Growth</h2>
                  <LineChart data={analytics.follower_growth} height={250} />
                </div>
              )}

              {/* Genre Breakdown */}
              {analytics.genre_breakdown.length > 0 && (
                <div className="card p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Genre Breakdown</h2>
                  <div className="space-y-6">
                    {analytics.genre_breakdown.map((genre) => {
                      const totalViews = analytics.genre_breakdown.reduce((sum, g) => sum + g.views, 0);
                      const percentage = totalViews > 0 ? (genre.views / totalViews) * 100 : 0;

                      return (
                        <div key={genre.genre}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{genre.genre}</span>
                            <span className="text-sm text-zinc-400">
                              {Math.round(percentage)}% ({genre.views.toLocaleString()} views)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-violet-600 to-violet-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {analytics.recent_activity.length > 0 && (
                <div className="card p-6 mb-8">
                  <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    {analytics.recent_activity.map((activity, index) => {
                      let icon = '👁️';
                      let message = '';

                      switch (activity.type) {
                        case 'view':
                          icon = '👁️';
                          message = `Someone watched "${activity.video_title}"`;
                          break;
                        case 'like':
                          icon = '❤️';
                          message = `Someone liked "${activity.video_title}"`;
                          break;
                        case 'follow':
                          icon = '👋';
                          message = `@${activity.actor_username} followed you`;
                          break;
                        case 'tip':
                          icon = '💰';
                          message = `Someone tipped on "${activity.video_title}"`;
                          break;
                        case 'comment':
                          icon = '💬';
                          message = `@${activity.actor_username} commented on "${activity.video_title}"`;
                          break;
                      }

                      return (
                        <div key={index} className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg">
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{message}</p>
                            <p className="text-sm text-zinc-400">{formatDate(activity.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-zinc-400 mb-4">No analytics data available yet.</p>
              <p className="text-sm text-zinc-500">
                Analytics will appear once viewers start watching your videos.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
