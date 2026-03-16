'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { Channel, Video } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';
import { formatViews, getInitials, getChannelBadge } from '@/lib/utils';

interface ChannelPageProps {
  params: {
    slug: string;
  };
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase();

        // Fetch channel
        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .select('*')
          .eq('slug', params.slug)
          .single();

        if (channelError) throw channelError;
        setChannel(channelData);

        // Fetch videos
        if (channelData?.id) {
          const { data: videosData } = await supabase
            .from('videos')
            .select('*')
            .eq('channel_id', channelData.id)
            .eq('status', 'ready')
            .order('created_at', { ascending: false });

          setVideos(videosData || []);
        }
      } catch (err) {
        console.error('Error fetching channel:', err);
        setChannel(placeholderChannel);
        setVideos(placeholderVideos);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
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
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Channel not found</p>
        </main>
        <Footer />
      </>
    );
  }

  const badge = getChannelBadge(channel.channel_type);

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        {/* Channel Header */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="card p-8 mb-8">
            <div className="flex items-start gap-6 mb-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0"
                style={{ backgroundColor: channel.avatar_color }}
              >
                {getInitials(channel.display_name)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold">{channel.display_name}</h1>
                  <div className={`badge ${badge.color}`}>
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </div>
                </div>
                <p className="text-zinc-400 mb-4">{channel.description}</p>

                {/* Stats */}
                <div className="flex gap-8 text-sm">
                  <div>
                    <p className="text-zinc-400">Videos</p>
                    <p className="font-bold">{channel.video_count}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Total Views</p>
                    <p className="font-bold">{formatViews(channel.total_views)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Joined</p>
                    <p className="font-bold">
                      {new Date(channel.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <button className="btn-primary px-8">Subscribe</button>
            </div>

            {/* Disclosure */}
            {channel.channel_type !== 'human' && (
              <div className="bg-violet-600/10 border border-violet-600/30 rounded-lg p-4 text-sm text-violet-400">
                This channel publishes {channel.channel_type === 'agent' ? 'AI-generated' : 'AI-enhanced'} content.
              </div>
            )}
          </div>

          {/* Videos */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Videos ({videos.length})</h2>
            {videos.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <p>No videos yet. This creator is just getting started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} channel={channel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// Placeholder data
const placeholderChannel: Channel = {
  id: '1',
  slug: 'ai-synthwave',
  display_name: 'AI Synthwave Studio',
  description: 'Pure AI-generated synthwave art and retro-futuristic aesthetics',
  channel_type: 'agent',
  avatar_color: '#7c3aed',
  owner_email: 'creator@agentictv.ai',
  total_views: 125000,
  video_count: 24,
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

const placeholderVideos: Video[] = [];
