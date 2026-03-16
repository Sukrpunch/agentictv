'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoSkeleton } from '@/components/VideoSkeleton';
import { Channel, Video } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';
import { formatDate, formatViews, getChannelBadge } from '@/lib/utils';

interface Analytics {
  total_views: number;
  views_by_day: { date: string; views: number }[];
  top_videos: { id: string; title: string; view_count: number; thumbnail_url: string | null }[];
  video_count: number;
  channel_type: string;
}

function LineChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map(d => d.views), 1);
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.views / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
      {/* Grid lines */}
      <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.5" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
      <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.5" />
      {/* Chart line */}
      <polyline
        points={points}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState(false);
  const [channelForm, setChannelForm] = useState({ display_name: '', description: '', channel_type: 'human' });

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      // Fetch channel
      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('owner_email', authUser.email)
        .single();

      if (channelData) {
        setChannel(channelData as unknown as Channel);
        setChannelForm({
          display_name: channelData.display_name,
          description: channelData.description || '',
          channel_type: channelData.channel_type as 'agent' | 'human' | 'hybrid',
        });

        // Fetch videos
        const { data: videosData } = await supabase
          .from('videos')
          .select('*')
          .eq('channel_id', channelData.id)
          .order('created_at', { ascending: false });

        setVideos(videosData || []);

        // Fetch analytics
        try {
          const analyticsResponse = await fetch('/api/analytics', {
            headers: {
              'x-user-email': authUser.email || '',
              'authorization': `Bearer ${authUser.id}`,
            } as HeadersInit,
          });
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData);
          }
        } catch (err) {
          console.error('Error fetching analytics:', err);
        }
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleUpdateChannel = async () => {
    if (!channel) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('channels')
        .update(channelForm)
        .eq('id', channel.id);

      if (error) throw error;

      setChannel({
        ...channel,
        ...channelForm,
        channel_type: channelForm.channel_type as 'agent' | 'human' | 'hybrid',
      });
      setEditingChannel(false);
      alert('Channel updated successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold">Dashboard</h1>
              <div className="h-10 w-24 bg-zinc-800 rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="card p-6 space-y-4 animate-pulse">
                  <div className="h-8 bg-zinc-800 rounded w-2/3" />
                  <div className="h-16 w-16 rounded-full bg-zinc-800 mx-auto" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto" />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="card p-6 animate-pulse">
                  <div className="h-8 bg-zinc-800 rounded w-1/3 mb-6" />
                  <div className="space-y-4">
                    <div className="h-4 bg-zinc-800 rounded w-full" />
                    <div className="h-4 bg-zinc-800 rounded w-5/6" />
                  </div>
                </div>
                <div className="card p-6 animate-pulse">
                  <div className="h-8 bg-zinc-800 rounded w-1/4 mb-6" />
                  <div className="space-y-4">
                    <div className="h-12 bg-zinc-800 rounded w-full" />
                    <div className="h-12 bg-zinc-800 rounded w-full" />
                  </div>
                </div>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <button onClick={handleLogout} className="btn-secondary px-6">
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Channel Card */}
              {channel && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold mb-4">Your Channel</h2>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                    style={{ backgroundColor: channel.avatar_color }}
                  >
                    {channel.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-center font-semibold mb-4">{channel.display_name}</h3>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Videos</span>
                      <span className="font-semibold">{channel.video_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Views</span>
                      <span className="font-semibold">{formatViews(channel.total_views)}</span>
                    </div>
                  </div>

                  <Link href={`/channel/${channel.slug}`} className="btn-secondary w-full text-center py-2">
                    View Channel
                  </Link>
                </div>
              )}

              {/* Upload Button */}
              <Link href="/upload" className="btn-primary w-full block text-center py-3 mt-6">
                + Upload Video
              </Link>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Channel Settings */}
              {channel && (
                <div className="card p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Channel Settings</h2>
                    {!editingChannel ? (
                      <button
                        onClick={() => setEditingChannel(true)}
                        className="text-violet-400 hover:text-violet-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingChannel(false)}
                        className="text-zinc-400 hover:text-zinc-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {editingChannel ? (
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateChannel();
                    }}>
                      <div>
                        <label className="block text-sm font-medium mb-2">Channel Name</label>
                        <input
                          type="text"
                          value={channelForm.display_name}
                          onChange={(e) => setChannelForm({ ...channelForm, display_name: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                          value={channelForm.description}
                          onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                          className="input-field h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Channel Type</label>
                        <select
                          value={channelForm.channel_type}
                          onChange={(e) => setChannelForm({ ...channelForm, channel_type: e.target.value })}
                          className="input-field"
                        >
                          <option value="agent">🤖 AI Generated</option>
                          <option value="human">👤 Human Created</option>
                          <option value="hybrid">🤝 Human + AI</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-primary w-full">
                        Save Changes
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-zinc-400 text-sm">Channel Name</p>
                        <p className="font-semibold">{channel.display_name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Description</p>
                        <p className="font-semibold">{channel.description || 'No description yet'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Channel Type</p>
                        <div className={`badge ${getChannelBadge(channel.channel_type).color} mt-1`}>
                          {getChannelBadge(channel.channel_type).emoji}
                          {getChannelBadge(channel.channel_type).label}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics */}
              {analytics && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="card p-6 text-center">
                      <p className="text-zinc-400 text-sm mb-1">Total Views</p>
                      <p className="text-3xl font-bold text-violet-400">{formatViews(analytics.total_views)}</p>
                    </div>
                    <div className="card p-6 text-center">
                      <p className="text-zinc-400 text-sm mb-1">Total Videos</p>
                      <p className="text-3xl font-bold text-violet-400">{analytics.video_count}</p>
                    </div>
                    <div className="card p-6 text-center">
                      <p className="text-zinc-400 text-sm mb-1">Avg Views/Video</p>
                      <p className="text-3xl font-bold text-violet-400">
                        {analytics.video_count > 0
                          ? formatViews(Math.floor(analytics.total_views / analytics.video_count))
                          : '0'}
                      </p>
                    </div>
                  </div>

                  {/* Views Chart */}
                  <div className="card p-6 mb-8">
                    <h3 className="text-xl font-bold mb-6">Views Over Last 30 Days</h3>
                    <LineChart data={analytics.views_by_day} />
                  </div>

                  {/* Top Videos */}
                  {analytics.top_videos.length > 0 && (
                    <div className="card p-6 mb-8">
                      <h3 className="text-xl font-bold mb-6">Top Videos</h3>
                      <div className="space-y-4">
                        {analytics.top_videos.map((video, index) => (
                          <div key={video.id} className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors">
                            <div className="text-2xl font-bold text-violet-400 w-8">#{index + 1}</div>
                            {video.thumbnail_url && (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-16 h-9 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{video.title}</p>
                              <p className="text-sm text-zinc-400">{formatViews(video.view_count)} views</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Videos List */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">My Videos</h2>
                {videos.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-zinc-400 mb-4">You haven't uploaded anything yet.</p>
                    <Link href="/upload" className="btn-primary inline-block">
                      Upload Your First Video
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-zinc-800">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Title</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Views</th>
                          <th className="text-left py-3 px-4 font-semibold">Uploaded</th>
                          <th className="text-right py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {videos.map((video) => (
                          <tr key={video.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                            <td className="py-3 px-4">
                              <p className="font-medium truncate">{video.title}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                                  video.status === 'ready'
                                    ? 'bg-green-500/20 text-green-400'
                                    : video.status === 'processing'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {video.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400">{formatViews(video.view_count)}</td>
                            <td className="py-3 px-4 text-zinc-400">{formatDate(video.created_at)}</td>
                            <td className="py-3 px-4 text-right">
                              <Link href={`/watch/${video.id}`} className="text-violet-400 hover:text-violet-300">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
