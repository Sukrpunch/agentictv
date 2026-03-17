'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';

interface Owner {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: string;
  owner: Owner;
  video_count: number;
  follower_count: number;
  is_public: boolean;
  cover_url?: string;
  created_at: string;
}

const themeColors: Record<string, string> = {
  'violet': '#7c3aed',
  'cyan': '#06b6d4',
  'pink': '#ec4899',
  'purple': '#8b5cf6',
  'amber': '#f59e0b',
  'emerald': '#10b981',
  'red': '#ef4444',
  'indigo': '#6366f1',
};

export default function ChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', theme: 'violet' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      fetchChannels();
      if (authUser) {
        fetchMyChannels(authUser.id);
      }
    }

    init();
  }, []);

  async function fetchChannels() {
    try {
      const response = await fetch('/api/community-channels');
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyChannels(userId: string) {
    try {
      const response = await fetch('/api/community-channels');
      const data = await response.json();
      const channels = data.channels || [];
      setMyChannels(channels.filter((ch: Channel) => ch.owner.id === userId));
    } catch (error) {
      console.error('Failed to fetch my channels:', error);
    }
  }

  async function handleCreateChannel() {
    if (!formData.name.trim()) {
      alert('Please enter a channel name');
      return;
    }

    setCreating(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/community-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create channel');
        return;
      }

      const data = await response.json();
      setShowCreateModal(false);
      setFormData({ name: '', description: '', theme: 'violet' });
      fetchChannels();
      if (user) {
        fetchMyChannels(user.id);
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Failed to create channel');
    } finally {
      setCreating(false);
    }
  }

  const getThemeColor = (theme: string) => themeColors[theme] || themeColors.violet;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <h1 className="text-5xl font-bold mb-2 flex items-center gap-3">
                <span className="text-3xl">📺</span> Community Channels
              </h1>
              <p className="text-xl text-zinc-400">
                Themed channels curated by creators. Discover and follow your favorite collections.
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                + Create Channel
              </button>
            )}
          </div>

          {/* Create Channel Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Create Channel</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., AI Sci-Fi Classics"
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What's your channel about?"
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Theme Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.keys(themeColors).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setFormData({ ...formData, theme })}
                          className={`h-10 rounded-lg transition-all ${
                            formData.theme === theme
                              ? 'ring-2 ring-offset-2 ring-offset-zinc-900'
                              : ''
                          }`}
                          style={{
                            backgroundColor: getThemeColor(theme),
                            ringColor: getThemeColor(theme),
                          }}
                          title={theme}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateChannel}
                      disabled={creating}
                      className="flex-1 px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Channels */}
          {user && myChannels.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">My Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {myChannels.map((channel) => (
                  <Link
                    key={channel.slug}
                    href={`/community-channels/${channel.slug}`}
                    className="rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div
                      className="h-24"
                      style={{
                        backgroundColor: `${getThemeColor(channel.theme)}20`,
                        borderBottom: `2px solid ${getThemeColor(channel.theme)}`,
                      }}
                    ></div>
                    <div className="p-4">
                      <h3 className="font-bold group-hover:text-violet-400 transition-colors">
                        {channel.name}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {channel.video_count} video{channel.video_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Channels */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Channels</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">Loading channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">No channels yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map((channel) => (
                  <Link
                    key={channel.slug}
                    href={`/community-channels/${channel.slug}`}
                    className="rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group bg-zinc-900"
                  >
                    <div
                      className="h-40"
                      style={{
                        backgroundColor: `${getThemeColor(channel.theme)}20`,
                      }}
                    >
                      {channel.cover_url && (
                        <img
                          src={channel.cover_url}
                          alt={channel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-violet-400 transition-colors">
                        {channel.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                        {channel.description || 'A curated collection of AI-generated videos.'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          {channel.video_count} video{channel.video_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-zinc-400">
                          👥 {channel.follower_count} follower{channel.follower_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="mt-16 p-8 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="text-xl font-bold mb-3">✨ Create Your Curated Channel</h3>
            <p className="text-zinc-300">
              Build a themed collection of your favorite AI-generated videos. Share your creative vision with the community and grow your audience around a specific aesthetic, tool, or genre.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
