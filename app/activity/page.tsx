'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  actor: { username: string; display_name: string; avatar_url?: string };
  thumbnail?: string;
  actionUrl: string;
  actionLabel: string;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  video_upload: '🎬',
  chart_entry: '📈',
  chart_number_one: '👑',
  challenge_winner: '🏆',
  challenge_opened: '⚔️',
  milestone_views: '🎉',
  milestone_followers: '🎉',
  new_creator: '✨',
  featured: '🌟',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchActivities = useCallback(
    async (cursor?: string | null) => {
      try {
        const url = new URL('/api/activity', window.location.origin);
        url.searchParams.set('limit', '20');
        if (cursor) {
          url.searchParams.set('before', cursor);
        }

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch activities');

        const { data, nextCursor: newCursor } = await response.json();

        if (cursor) {
          setActivities((prev) => [...prev, ...data]);
        } else {
          setActivities(data);
        }

        setNextCursor(newCursor);
        setHasMore(!!newCursor);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && nextCursor) {
          fetchActivities(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, nextCursor, fetchActivities]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#09090b]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2">🌊 Activity Feed</h1>
            <p className="text-xl text-zinc-400">
              What's happening on Agentic TV right now
            </p>
          </div>

          {/* Live indicator */}
          <div className="mb-8 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Live updates</span>
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            {loading && activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">No activities yet. Be the first!</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-violet-500/50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {activity.thumbnail && (
                      <div className="flex-shrink-0">
                        <img
                          src={activity.thumbnail}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base text-white break-words">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-zinc-400 mt-1">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-xs text-zinc-500 mt-2">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        {/* Action button */}
                        {activity.actionUrl && (
                          <Link
                            href={activity.actionUrl}
                            className="flex-shrink-0 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
                          >
                            {activity.actionLabel}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load more sentinel */}
          <div ref={observerTarget} className="mt-12 text-center">
            {loading && activities.length > 0 && (
              <p className="text-zinc-400">Loading more...</p>
            )}
            {!hasMore && activities.length > 0 && (
              <p className="text-zinc-500">No more activities</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
