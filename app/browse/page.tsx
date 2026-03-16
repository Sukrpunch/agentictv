'use client';

import { useState, useEffect } from 'react';
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
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'featured'>('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch videos from Supabase
    async function fetchVideos() {
      try {
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
        } else if (sortBy === 'featured') {
          query = query.eq('is_featured', true).order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(20);

        if (error) {
          console.error('Error fetching videos:', error);
          // Use placeholder data
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

    fetchVideos();
  }, [selectedCategory, sortBy]);

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
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'views' | 'featured')}
                className="input-field"
              >
                <option value="latest">Latest</option>
                <option value="views">Most Viewed</option>
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
      video_count: 24,
      created_at: new Date().toISOString(),
    },
  },
];
