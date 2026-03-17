'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { getSupabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

interface Playlist {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  cover_url: string;
  is_public: boolean;
  video_count: number;
  follower_count: number;
  created_at: string;
  playlist_videos: Array<{
    video_id: string;
    position: number;
    added_at: string;
    videos: Video;
  }>;
}

interface PlaylistPageProps {
  params: {
    id: string;
  };
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUser(user);

        // Fetch playlist
        const response = await fetch(`/api/playlists/${params.id}`, {
          headers: {
            authorization: user ? `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}` : '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPlaylist(data);
          setIsOwner(user?.id === data.creator_id);
        }
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  async function handleDeletePlaylist() {
    if (!confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      const session = await getSupabase().auth.getSession();
      const response = await fetch(`/api/playlists/${params.id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${session.data.session?.access_token || ''}`,
        },
      });

      if (response.ok) {
        router.push('/playlists');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  }

  async function handleRemoveVideo(videoId: string) {
    try {
      const session = await getSupabase().auth.getSession();
      const response = await fetch(`/api/playlists/${params.id}/videos?video_id=${videoId}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${session.data.session?.access_token || ''}`,
        },
      });

      if (response.ok) {
        setPlaylist(
          playlist
            ? {
                ...playlist,
                playlist_videos: playlist.playlist_videos.filter((pv) => pv.video_id !== videoId),
              }
            : null
        );
      }
    } catch (error) {
      console.error('Error removing video:', error);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-8">
          <div className="text-zinc-400">Loading playlist...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!playlist) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-8">
          <div className="text-zinc-400">Playlist not found</div>
        </main>
        <Footer />
      </>
    );
  }

  const sortedVideos = [...playlist.playlist_videos].sort((a, b) => a.position - b.position);

  return (
    <>
      <Header />
      <main className="min-h-screen px-6 py-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          {/* Playlist Header */}
          <div className="mb-8 flex gap-6">
            <div className="w-32 h-32 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
              {playlist.cover_url ? (
                <img
                  src={playlist.cover_url}
                  alt={playlist.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <svg className="w-16 h-16 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 9h12v5H4V9z" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{playlist.title}</h1>
              {playlist.description && (
                <p className="text-zinc-400 mb-4">{playlist.description}</p>
              )}
              <p className="text-sm text-zinc-500 mb-4">
                {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'} •{' '}
                {playlist.follower_count} {playlist.follower_count === 1 ? 'follower' : 'followers'}
              </p>

              <div className="flex gap-2">
                {isOwner ? (
                  <button
                    onClick={handleDeletePlaylist}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors text-sm"
                  >
                    Delete Playlist
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors text-sm">
                    Follow
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {sortedVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedVideos.map((pv, idx) => (
                <div key={pv.video_id} className="relative group">
                  <VideoCard video={pv.videos} />
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveVideo(pv.video_id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-700 p-2 rounded text-white text-xs"
                      title="Remove from playlist"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">This playlist is empty</p>
              {isOwner && (
                <Link
                  href="/browse"
                  className="text-violet-400 hover:text-violet-300"
                >
                  Add videos to this playlist
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
