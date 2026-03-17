'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';
import { Profile, Video } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SearchTab = 'videos' | 'creators';

interface SearchResult {
  videos: (Video & { channel?: any })[];
  creators: Profile[];
  query: string;
}

function VideoSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="aspect-video bg-zinc-700 rounded mb-4" />
      <div className="h-4 bg-zinc-700 rounded mb-2" />
      <div className="h-3 bg-zinc-700 rounded w-2/3" />
    </div>
  );
}

function CreatorSkeleton() {
  return (
    <div className="card p-6 flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-zinc-700" />
      <div className="flex-1">
        <div className="h-4 bg-zinc-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-zinc-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<SearchTab>('videos');
  const [results, setResults] = useState<SearchResult>({
    videos: [],
    creators: [],
    query: '',
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = getSupabase();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);
    }
    getUser();
  }, []);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults({ videos: [], creators: [], query: '' });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabase = getSupabase();

        // Search videos
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('*, channel:channels(display_name, slug, avatar_color)', { count: 'exact' })
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('status', 'ready')
          .order('view_count', { ascending: false })
          .limit(20);

        // Search creators
        const { data: creatorsData, error: creatorsError } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .order('follower_count', { ascending: false })
          .limit(20);

        if (!videosError && !creatorsError) {
          setResults({
            videos: videosData || [],
            creators: creatorsData || [],
            query,
          });
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  const cloudflareVideoThumbnail = (videoId: string) =>
    `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;

  const isFollowing = (creatorId: string) => {
    // TODO: Check if user is following this creator
    return false;
  };

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Search Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">
              {query ? `Search results for "${query}"` : 'Search'}
            </h1>
            <p className="text-zinc-400">
              {loading
                ? 'Searching...'
                : query
                  ? `Found ${results.videos.length} videos and ${results.creators.length} creators`
                  : 'Enter a search term to get started'}
            </p>
          </div>

          {/* Tabs */}
          {query && (
            <div className="flex gap-4 mb-8 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('videos')}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'text-violet-400 border-b-2 border-violet-600'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Videos ({results.videos.length})
              </button>
              <button
                onClick={() => setActiveTab('creators')}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === 'creators'
                    ? 'text-violet-400 border-b-2 border-violet-600'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Creators ({results.creators.length})
              </button>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <VideoSkeleton key={i} />
                  ))}
                </div>
              ) : results.videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.videos.map((video) => (
                    <Link
                      key={video.id}
                      href={`/watch/${video.id}`}
                      className="card overflow-hidden hover:border-violet-600 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                        <img
                          src={
                            (video.cloudflare_video_id || video.cloudflare_stream_id)
                              ? cloudflareVideoThumbnail(video.cloudflare_video_id || video.cloudflare_stream_id || '')
                              : video.thumbnail_url || '/placeholder.png'
                          }
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                          {video.duration_seconds
                            ? `${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, '0')}`
                            : 'N/A'}
                        </div>
                      </div>

                      <div className="p-4">
                        {/* Title */}
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                          {video.title}
                        </h3>

                        {/* Creator */}
                        <p className="text-sm text-zinc-400 mb-3">
                          {video.channel?.display_name || 'Unknown Creator'}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>{video.view_count?.toLocaleString() || 0} views</span>
                          {video.is_collab && <span className="text-violet-400">🤝 Collab</span>}
                          {video.is_remix && <span className="text-violet-400">🎵 Remix</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-zinc-400 mb-4">No videos found</p>
                  <Link href="/browse" className="btn-secondary">
                    Browse all videos
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Creators Tab */}
          {activeTab === 'creators' && (
            <div>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <CreatorSkeleton key={i} />
                  ))}
                </div>
              ) : results.creators.length > 0 ? (
                <div className="space-y-4">
                  {results.creators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creators/${creator.username}`}
                      className="card p-6 flex items-center justify-between hover:border-violet-600 transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-600 to-violet-800 text-white font-bold text-xl"
                          title={creator.display_name}
                        >
                          {creator.display_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate">
                            {creator.display_name}
                          </h3>
                          <p className="text-sm text-zinc-400 truncate">@{creator.username}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {creator.follower_count?.toLocaleString() || 0} followers
                          </p>
                        </div>
                      </div>

                      {/* Follow Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // TODO: Implement follow logic
                        }}
                        className={`ml-4 px-4 py-2 rounded font-medium text-sm transition-colors flex-shrink-0 ${
                          isFollowing(creator.id)
                            ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                      >
                        {isFollowing(creator.id) ? 'Following' : 'Follow'}
                      </button>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-zinc-400 mb-4">No creators found</p>
                  <Link href="/creators" className="btn-secondary">
                    Browse creators
                  </Link>
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
