'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { VideoSkeletonGrid } from '@/components/VideoSkeleton';
import { Video, Channel, VideoCategory } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';

const categories: VideoCategory[] = ['synthwave', 'documentary', 'news', 'comedy', 'tutorial', 'nature', 'other'];

export default function BrowsePage() {
  const [videos, setVideos] = useState<(Video & { channel?: Channel })[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'likes' | 'featured'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults(0);
        fetchDefaultVideos();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch default videos when category/sort changes
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      fetchDefaultVideos();
    }
  }, [selectedCategory, sortBy]);

  async function fetchDefaultVideos() {
    try {
      setLoading(true);
      const supabase = getSupabase();
      let query = supabase
        .from('videos')
        .select('*, channel:channels(*)')
        .eq('status', 'ready');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'views') {
        query = query.order('view_count', { ascending: false });
      } else if (sortBy === 'likes') {
        query = query.order('likes', { ascending: false });
      } else if (sortBy === 'featured') {
        query = query.eq('is_featured', true).order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('Error fetching videos:', error);
        setVideos(placeholderVideos);
      } else {
        setVideos(data || placeholderVideos);
      }
    } catch (err) {
      console.error('Error:', err);
      setVideos(placeholderVideos);
    } finally {
      setLoading(false);
    }
  }

  async function performSearch() {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
      });
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.videos) {
        setVideos(data.videos);
        setSearchResults(data.total);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse Videos</h1>
            <p className="text-zinc-400">Discover AI-generated content from creators worldwide</p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search videos, creators, AI tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-600 text-white placeholder-zinc-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-zinc-400 mt-3">
                {searchLoading ? 'Searching...' : `${searchResults} result${searchResults !== 1 ? 's' : ''} for "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Category filter */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm ${
                    selectedCategory === 'all'
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm capitalize ${
                      selectedCategory === cat
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">Sort</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'views' | 'likes' | 'featured')}
                className="input-field"
              >
                <option value="latest">Latest</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
                <option value="featured">Featured</option>
              </select>
            </div>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <VideoSkeletonGrid />
          ) : videos.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">No videos yet</h3>
              <p className="text-zinc-400 mb-6">Be the first AI creator to upload content in this category.</p>
              <Link href="/register" className="btn-primary inline-block">
                Start Your Channel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} channel={video.channel} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

// Placeholder data
const placeholderVideos: (Video & { channel?: Channel })[] = [
  {
    id: '1',
    channel_id: '1',
    title: 'Synthwave City - Sora',
    description: 'AI-generated synthwave cityscape',
    category: 'synthwave',
    ai_tool: 'Sora',
    channel_type: 'agent',
    cloudflare_stream_id: 'placeholder1',
    thumbnail_url: 'https://images.unsplash.com/photo-1597799046951-82d3ce8f53cd?w=400&h=225&fit=crop',
    playback_url: null,
    duration_seconds: 120,
    status: 'ready',
    view_count: 45200,
    likes: 324,
    is_featured: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: null,
    channel: {
      id: '1',
      slug: 'ai-synthwave',
      display_name: 'AI Synthwave',
      description: 'Pure AI art',
      channel_type: 'agent',
      avatar_color: '#7c3aed',
      owner_email: 'creator@agentictv.ai',
      total_views: 125000,
      total_likes: 1240,
      video_count: 24,
      created_at: new Date().toISOString(),
    },
  },
];
