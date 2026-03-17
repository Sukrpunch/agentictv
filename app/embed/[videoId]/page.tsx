'use client';

import { useState, useEffect } from 'react';
import { Video, Channel } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';

interface EmbedPageProps {
  params: {
    videoId: string;
  };
}

export default function EmbedPage({ params }: EmbedPageProps) {
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabase();

        // Fetch video
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', params.videoId)
          .single();

        if (videoError) throw videoError;
        setVideo(videoData);

        // Fetch channel
        if (videoData?.channel_id) {
          const { data: channelData } = await supabase
            .from('channels')
            .select('*')
            .eq('id', videoData.channel_id)
            .single();

          if (channelData) setChannel(channelData);
        }
      } catch (err) {
        console.error('Error fetching video:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.videoId]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Video not found</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-950">
      {/* Video Player */}
      <div className="w-full max-w-4xl mx-auto">
        {video.cloudflare_stream_id ? (
          <iframe
            src={`https://iframe.videodelivery.net/${video.cloudflare_stream_id}`}
            style={{
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
            }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="w-full aspect-video bg-zinc-900 flex items-center justify-center">
            <div className="text-zinc-400">Video player unavailable</div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="px-6 py-4 border-t border-zinc-800">
        <h1 className="text-xl font-bold text-white mb-2">{video.title}</h1>
        {channel && (
          <p className="text-zinc-400 text-sm">{channel.display_name}</p>
        )}
      </div>
    </div>
  );
}
