'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { VideoCard } from '@/components/VideoCard';
import { getSupabase } from '@/lib/supabase';

interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
  creator_id?: string;
  view_count: number;
  created_at: string;
}

interface DailyMixProps {
  userId?: string;
}

export function DailyMix({ userId }: DailyMixProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMix() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setLoading(false);
        return;
      }

      setUser(authUser);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/recommendations/daily-mix', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVideos(data.recommendations || []);
        }
      } catch (error) {
        console.error('Error loading daily mix:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMix();
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-2">🎬 Mason's Daily Mix</h2>
        <p className="text-zinc-400 text-sm mb-4">Curated for you · Updated daily</p>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 h-48 bg-zinc-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="mb-12 card p-6">
        <h2 className="text-2xl font-bold mb-2">🎬 Mason's Daily Mix</h2>
        <p className="text-zinc-400">
          Watch a few videos and Mason will start curating your mix
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">🎬 Mason's Daily Mix</h2>
          <p className="text-zinc-400 text-sm">Curated for you · Updated daily</p>
        </div>
        <Link
          href="/browse?mix=daily"
          className="text-violet-400 hover:text-violet-300 text-sm font-medium"
        >
          Watch All →
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {videos.map((video) => (
          <div key={video.id} className="flex-shrink-0 w-40 snap-start">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
