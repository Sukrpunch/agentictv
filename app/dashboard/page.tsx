'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Channel, Video } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';
import { formatDate, formatViews, getChannelBadge } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
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
        setChannel(channelData);
        setChannelForm({
          display_name: channelData.display_name,
          description: channelData.description || '',
          channel_type: channelData.channel_type,
        });

        // Fetch videos
        const { data: videosData } = await supabase
          .from('videos')
          .select('*')
          .eq('channel_id', channelData.id)
          .order('created_at', { ascending: false });

        setVideos(videosData || []);
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

      setChannel({ ...channel, ...channelForm });
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
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
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

              {/* Videos List */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">My Videos</h2>
                {videos.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">
                    No videos yet.{' '}
                    <Link href="/upload" className="text-violet-400 hover:text-violet-300">
                      Upload your first video
                    </Link>
                  </p>
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
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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
