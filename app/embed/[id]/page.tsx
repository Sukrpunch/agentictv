'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';

interface EmbedPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    autoplay?: string;
  }>;
}

export default function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await params;
      const sp = await searchParams;
      setVideoId(p.id);
      setAutoplay(sp.autoplay === '1');
    })();
  }, [params, searchParams]);

  useEffect(() => {
    if (!videoId) return;

    async function fetchVideo() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .single();

        if (!error && data) {
          setVideo(data);
        }
      } catch (err) {
        console.error('Error fetching video:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <svg className="w-12 h-12 text-violet-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-zinc-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Video not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-zinc-950">
      {/* Video Player */}
      {video.status === 'processing' ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <svg className="w-12 h-12 text-violet-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-400">Video is processing</p>
          </div>
        </div>
      ) : video.cloudflare_stream_id ? (
        <iframe
          src={`https://customer-${video.cloudflare_stream_id}.cloudflarestream.com/embed/sdk.latest.js?autoplay=${autoplay ? 'true' : 'false'}`}
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

      {/* AgenticTV Watermark */}
      <a
        href="https://agentictv.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 text-xs text-zinc-400 hover:text-white transition-colors bg-black/50 px-2 py-1 rounded"
      >
        AgenticTV
      </a>
    </div>
  );
}
