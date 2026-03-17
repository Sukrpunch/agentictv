'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';

interface Playlist {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  is_public: boolean;
  video_count: number;
  follower_count: number;
  created_at: string;
}

export default function PlaylistsPage() {
  const router = useRouter();
  const [ownPlaylists, setOwnPlaylists] = useState<Playlist[]>([]);
  const [followedPlaylists, setFollowedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', is_public: true });

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
      await fetchPlaylists();
    }

    checkAuthAndFetch();
  }, [router]);

  async function fetchPlaylists() {
    try {
      const response = await fetch('/api/playlists', {
        headers: {
          authorization: `Bearer ${(await getSupabase().auth.getSession()).data.session?.access_token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOwnPlaylists(data.ownPlaylists || []);
        setFollowedPlaylists(data.followedPlaylists || []);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePlaylist(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${(await getSupabase().auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: '', description: '', is_public: true });
        setShowCreateModal(false);
        await fetchPlaylists();
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  }

  if (!authenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen px-6 py-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">My Playlists</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              Create Playlist
            </button>
          </div>

          {loading ? (
            <div className="text-zinc-400">Loading playlists...</div>
          ) : (
            <>
              {/* Own Playlists */}
              {ownPlaylists.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-xl font-semibold text-white mb-4">Your Playlists</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownPlaylists.map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${playlist.id}`}
                        className="group bg-zinc-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-video bg-zinc-800 group-hover:bg-zinc-700 transition-colors flex items-center justify-center">
                          {playlist.cover_url ? (
                            <img
                              src={playlist.cover_url}
                              alt={playlist.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 9h12v5H4V9z" />
                            </svg>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white truncate">{playlist.title}</h3>
                          <p className="text-sm text-zinc-400 mt-1">
                            {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'}
                          </p>
                          {playlist.description && (
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{playlist.description}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Followed Playlists */}
              {followedPlaylists.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Following</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {followedPlaylists.map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${playlist.id}`}
                        className="group bg-zinc-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-video bg-zinc-800 group-hover:bg-zinc-700 transition-colors flex items-center justify-center">
                          {playlist.cover_url ? (
                            <img
                              src={playlist.cover_url}
                              alt={playlist.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 9h12v5H4V9z" />
                            </svg>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white truncate">{playlist.title}</h3>
                          <p className="text-sm text-zinc-400 mt-1">
                            {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'}
                          </p>
                          {playlist.description && (
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{playlist.description}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {ownPlaylists.length === 0 && followedPlaylists.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-400 mb-4">No playlists yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors inline-block"
                  >
                    Create your first playlist
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My awesome playlist"
                  className="w-full px-3 py-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-violet-600 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this playlist about?"
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-violet-600 outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  id="is_public"
                  className="rounded"
                />
                <label htmlFor="is_public" className="text-sm text-zinc-300">
                  Public
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
