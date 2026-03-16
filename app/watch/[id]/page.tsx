'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { Video, Channel } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';
import { formatDate, formatViews, getChannelBadge, getInitials } from '@/lib/utils';

interface WatchPageProps {
  params: {
    id: string;
  };
}

export default function WatchPage({ params }: WatchPageProps) {
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<(Video & { channel?: Channel })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Increment view count
    async function incrementViews() {
      try {
        const response = await fetch('/api/videos/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: params.id }),
        });
        if (!response.ok) console.error('Failed to increment views');
      } catch (err) {
        console.error('Error incrementing views:', err);
      }
    }

    // Fetch video and channel data
    async function fetchData() {
      try {
        const supabase = getSupabase();

        // Fetch video
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', params.id)
          .single();

        if (videoError) throw videoError;
        setVideo(videoData);

        // Fetch channel
        if (videoData?.channel_id) {
          const { data: channelData, error: channelError } = await supabase
            .from('channels')
            .select('*')
            .eq('id', videoData.channel_id)
            .single();

          if (!channelError) setChannel(channelData);
        }

        // Fetch related videos
        const { data: relatedData } = await supabase
          .from('videos')
          .select('*, channel:channels(*)')
          .eq('category', videoData?.category)
          .neq('id', params.id)
          .eq('status', 'ready')
          .order('view_count', { ascending: false })
          .limit(6);

        setRelatedVideos(relatedData || []);

        // Increment views after fetching
        incrementViews();
      } catch (err) {
        console.error('Error fetching data:', err);
        // Use placeholder
        setVideo(placeholderVideo);
        setChannel(placeholderChannel);
        setRelatedVideos(placeholderRelated);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Loading video...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Video not found</p>
        </main>
        <Footer />
      </>
    );
  }

  const badge = getChannelBadge(video.channel_type);

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-8">
              {video.cloudflare_stream_id ? (
                <iframe
                  src={`https://customer-${video.cloudflare_stream_id}.cloudflarestream.com/embed/sdk.latest.js`}
                  loading="lazy"
                  style={{
                    border: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                  }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <svg className="w-24 h-24 text-zinc-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Video Info */}
            <h1 className="text-4xl font-bold mb-4">{video.title}</h1>

            {/* Channel Info + Badge */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: channel?.avatar_color || '#7c3aed' }}
                >
                  {channel && getInitials(channel.display_name)}
                </div>
                <div>
                  <Link href={`/channel/${channel?.slug}`} className="font-semibold hover:text-violet-400 transition-colors">
                    {channel?.display_name || 'Unknown'}
                  </Link>
                  <p className="text-sm text-zinc-400">{formatViews(channel?.total_views || 0)} total views</p>
                </div>
              </div>
              <button className="btn-primary px-6">Subscribe</button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mb-8 text-sm text-zinc-400">
              <span>{formatViews(video.view_count)} views</span>
              <span>{formatDate(video.created_at)}</span>
              {video.duration_seconds && (
                <span>{Math.floor(video.duration_seconds / 60)} min</span>
              )}
            </div>

            {/* Description */}
            <div className="card p-6 mb-8">
              <h3 className="font-semibold mb-4">Description</h3>
              <p className="text-zinc-300 whitespace-pre-wrap">{video.description || 'No description provided.'}</p>
            </div>

            {/* AI Credits */}
            {video.ai_tool && (
              <div className="card p-6 mb-8 bg-violet-600/10 border-violet-600/30">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-violet-400">🤖</span> AI Credits
                </h3>
                <p className="text-zinc-300">
                  Made with <span className="font-semibold text-violet-400">{video.ai_tool}</span>
                </p>
              </div>
            )}

            {/* Badge Display */}
            <div className={`badge ${badge.color} text-lg py-3 px-4`}>
              <span>{badge.emoji}</span>
              <span>{badge.label}</span>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-lg mb-6">Related Videos</h3>
            <div className="space-y-4">
              {relatedVideos.slice(0, 4).map((v) => (
                <Link key={v.id} href={`/watch/${v.id}`} className="group">
                  <div className="card p-3 hover:bg-zinc-800 transition-colors">
                    <div className="aspect-video bg-zinc-800 rounded mb-2 overflow-hidden">
                      {v.thumbnail_url ? (
                        <img
                          src={v.thumbnail_url}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800" />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-violet-400 transition-colors">
                      {v.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">{formatViews(v.view_count)} views</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// Placeholder data
const placeholderVideo: Video = {
  id: 'placeholder',
  channel_id: '1',
  title: 'Stunning AI-Generated Synthwave City',
  description: 'This is a placeholder video demonstrating the AgenticTV platform. Created with Sora, this video showcases the beautiful synthwave aesthetic.',
  category: 'synthwave',
  ai_tool: 'Sora',
  channel_type: 'agent',
  cloudflare_stream_id: null,
  thumbnail_url: 'https://images.unsplash.com/photo-1597799046951-82d3ce8f53cd?w=800&h=450&fit=crop',
  playback_url: null,
  duration_seconds: 120,
  status: 'ready',
  view_count: 45200,
  is_featured: true,
  created_at: new Date().toISOString(),
  published_at: new Date().toISOString(),
};

const placeholderChannel: Channel = {
  id: '1',
  slug: 'ai-synthwave',
  display_name: 'AI Synthwave',
  description: 'Pure AI-generated synthwave art and aesthetics',
  channel_type: 'agent',
  avatar_color: '#7c3aed',
  owner_email: 'creator@agentictv.ai',
  total_views: 125000,
  video_count: 24,
  created_at: new Date().toISOString(),
};

const placeholderRelated: (Video & { channel?: Channel })[] = [];
