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
        <main className="min-h-screen px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="card p-8 animate-pulse mb-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-8 bg-zinc-800 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-zinc-800 rounded w-2/3 mb-6" />
                  <div className="flex gap-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <div className="h-4 bg-zinc-800 rounded w-20 mb-2" />
                        <div className="h-6 bg-zinc-800 rounded w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!channel) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Channel Not Found</h1>
            <p className="text-zinc-400 mb-6">This channel doesn't exist in our AI universe.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/browse" className="btn-primary">
                Browse Channels
              </Link>
              <Link href="/register" className="btn-secondary">
                Create Channel
              </Link>
            </div>
          </div>
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
          {/* Banner */}
          <div
            className="h-32 rounded-xl mb-8 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${channel.avatar_color}40 0%, ${channel.avatar_color}10 100%)`,
              borderWidth: '1px',
              borderColor: `${channel.avatar_color}40`,
            }}
          />

          {/* Header Info */}
          <div className="card p-8 mb-8 -mt-16 relative z-10 ml-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold flex-shrink-0 border-4 border-zinc-950"
                style={{ backgroundColor: channel.avatar_color }}
              >
                {getInitials(channel.display_name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold">{channel.display_name}</h1>
                  <div className={`badge ${badge.color}`}>
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </div>
                </div>
                <p className="text-zinc-400 mb-6 line-clamp-2">{channel.description}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="text-zinc-400">{channel.video_count} videos</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">{formatViews(channel.total_views)} total views</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">
                      Joined {new Date(channel.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <button className="btn-primary px-8 flex-shrink-0">Subscribe</button>
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
              <div className="card p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-zinc-400">No videos yet. This creator is just getting started!</p>
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
