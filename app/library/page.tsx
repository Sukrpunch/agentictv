'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { getSupabase } from '@/lib/supabase';
import { Video, Channel } from '@/lib/types';

interface LibraryVideo {
  video_id?: string;
  id?: string;
  videos?: Video & { channel?: Channel };
}

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'likes' | 'watch_later' | 'playlists'>('likes');
  const [videos, setVideos] = useState<(Video & { channel?: Channel })[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
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
      await fetchData('likes');
    }

    checkAuthAndFetch();
  }, [router]);

  async function fetchData(tab: 'likes' | 'watch_later' | 'playlists') {
    setLoading(true);
    try {
      const session = await getSupabase().auth.getSession();
      const token = session.data.session?.access_token || '';

      let url = '/api/likes';
      if (tab === 'watch_later') {
        url = '/api/watch-later';
      } else if (tab === 'playlists') {
        url = '/api/playlists';
      }

      const response = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();

        if (tab === 'playlists') {
          setPlaylists([...(data.ownPlaylists || []), ...(data.followedPlaylists || [])]);
        } else {
          const videoList = data
            .map((item: any) => item.videos || item)
            .filter((v: any) => v && v.id);
          setVideos(videoList);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = async (tab: 'likes' | 'watch_later' | 'playlists') => {
    setActiveTab(tab);
    await fetchData(tab);
  };

  if (!authenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen px-6 py-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Your Library</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-zinc-800">
            <button
              onClick={() => handleTabChange('likes')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'likes'
                  ? 'text-violet-400 border-violet-600'
                  : 'text-zinc-400 border-transparent hover:text-white'
              }`}
            >
              Liked Videos
            </button>
            <button
              onClick={() => handleTabChange('watch_later')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'watch_later'
                  ? 'text-violet-400 border-violet-600'
                  : 'text-zinc-400 border-transparent hover:text-white'
              }`}
            >
              Watch Later
            </button>
            <button
              onClick={() => handleTabChange('playlists')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'playlists'
                  ? 'text-violet-400 border-violet-600'
                  : 'text-zinc-400 border-transparent hover:text-white'
              }`}
            >
              Playlists
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-zinc-400">Loading...</div>
          ) : activeTab === 'playlists' ? (
            // Playlists Grid
            <div>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist) => (
                    <a
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
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-400">No playlists yet</p>
                </div>
              )}
            </div>
          ) : (
            // Videos Grid
            <div>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-400">
                    {activeTab === 'likes' && 'No liked videos yet'}
                    {activeTab === 'watch_later' && 'No videos in watch later'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
