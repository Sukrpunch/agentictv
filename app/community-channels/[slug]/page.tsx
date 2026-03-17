'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { getSupabase } from '@/lib/supabase';

interface Owner {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface Video {
  id: string;
  title: string;
  cloudflare_stream_id: string;
  thumbnail_url?: string;
  view_count: number;
  likes: number;
  duration_seconds: number;
  created_at: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: string;
  owner: Owner;
  video_ids: string[];
  videos: Video[];
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

export default function ChannelPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      fetchChannel();
    }

    init();
  }, [params.slug]);

  async function fetchChannel() {
    try {
      const response = await fetch(`/api/community-channels/${params.slug}`);
      if (!response.ok) {
        router.push('/community-channels');
        return;
      }
      const data = await response.json();
      setChannel(data.channel);
    } catch (error) {
      console.error('Failed to fetch channel:', error);
      router.push('/community-channels');
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsFollowing(!isFollowing);
    // In a real implementation, this would call an API endpoint
  }

  async function handleDeleteChannel() {
    if (!user || !channel || channel.owner.id !== user.id) {
      return;
    }

    setDeleting(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/community-channels/${params.slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        alert('Failed to delete channel');
        return;
      }

      router.push('/community-channels');
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Failed to delete channel');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <p className="text-zinc-400">Loading channel...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!channel) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <p className="text-zinc-400">Channel not found</p>
        </main>
        <Footer />
      </>
    );
  }

  const themeColor = themeColors[channel.theme] || themeColors.violet;
  const isOwner = user && user.id === channel.owner.id;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950">
        {/* Cover Image */}
        <div
          className="h-64 bg-gradient-to-br from-zinc-900 to-zinc-950"
          style={{
            backgroundColor: `${themeColor}20`,
          }}
        >
          {channel.cover_url && (
            <img
              src={channel.cover_url}
              alt={channel.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Channel Info */}
          <div className="mb-12">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-5xl font-bold mb-2">{channel.name}</h1>
                  <p className="text-zinc-400">
                    by <span className="text-white font-semibold">@{channel.owner.display_name}</span>
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors font-semibold"
                  >
                    Delete Channel
                  </button>
                )}
              </div>

              {channel.description && (
                <p className="text-lg text-zinc-300 mb-6">{channel.description}</p>
              )}

              <div className="flex flex-wrap gap-6 mb-6">
                <div>
                  <span className="text-3xl font-bold text-white">{channel.video_count}</span>
                  <p className="text-zinc-400 text-sm">video{channel.video_count !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-white">{channel.follower_count}</span>
                  <p className="text-zinc-400 text-sm">followers</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    isFollowing
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
                <button className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors font-semibold">
                  Share
                </button>
                {channel.video_count > 0 && (
                  <button
                    style={{ backgroundColor: themeColor }}
                    className="px-6 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    Watch All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">Delete Channel?</h2>
                <p className="text-zinc-400 mb-6">
                  This action cannot be undone. All channel data will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteChannel}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Videos Grid */}
          {channel.video_count === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">No videos in this channel yet.</p>
              {isOwner && (
                <p className="text-zinc-500 text-sm">
                  Add videos by going to a video's page and selecting this channel.
                </p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-6">Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channel.videos?.map((video) => (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div className="relative bg-black h-40">
                      <img
                        src={video.thumbnail_url || `https://videodelivery.net/${video.cloudflare_stream_id}/thumbnails/thumbnail.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
                          ▶
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-900">
                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>👁️ {video.view_count?.toLocaleString() || 0}</span>
                        <span>❤️ {video.likes?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
