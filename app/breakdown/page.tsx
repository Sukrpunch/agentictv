'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { formatDate, formatViews } from '@/lib/utils';

interface Breakdown {
  id: string;
  week_start: string;
  highlight_text: string;
  total_views_week: number;
  new_creators_count: number;
  trending_genre: string;
  top_video?: any;
  top_creator?: any;
}

export default function BreakdownPage() {
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBreakdowns() {
      try {
        const response = await fetch('/api/breakdown?limit=10');
        if (response.ok) {
          const data = await response.json();
          setBreakdowns(data.breakdowns || []);
        }
      } catch (error) {
        console.error('Error loading breakdowns:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBreakdowns();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12 flex items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  const latestBreakdown = breakdowns[0];
  const pastBreakdowns = breakdowns.slice(1);

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {latestBreakdown ? (
            <>
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-5xl font-bold mb-2">🎬 Mason's Weekly Breakdown</h1>
                <p className="text-zinc-400">
                  Week of {new Date(latestBreakdown.week_start).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Highlight Quote */}
              <div className="card bg-violet-900/20 border border-violet-700/50 p-8 mb-12">
                <p className="text-2xl font-light italic text-zinc-100 leading-relaxed">
                  "{latestBreakdown.highlight_text}"
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="card p-4">
                  <div className="text-3xl font-bold text-violet-400">
                    {formatViews(latestBreakdown.total_views_week)}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">Views</p>
                </div>

                <div className="card p-4">
                  <div className="text-3xl font-bold text-violet-400">
                    {latestBreakdown.new_creators_count}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">New Creators</p>
                </div>

                <div className="card p-4">
                  <div className="text-xl font-bold text-violet-400 truncate">
                    {latestBreakdown.trending_genre}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">Trending Genre</p>
                </div>

                <div className="card p-4">
                  <div className="text-3xl font-bold text-violet-400">
                    📊
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">By The Numbers</p>
                </div>
              </div>

              {/* Video of the Week */}
              {latestBreakdown.top_video && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span>🏆</span>
                    Video of the Week
                  </h2>
                  <div className="card p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {latestBreakdown.top_video.thumbnail_url && (
                        <div className="md:col-span-1">
                          <Image
                            src={latestBreakdown.top_video.thumbnail_url}
                            alt={latestBreakdown.top_video.title}
                            width={300}
                            height={200}
                            className="rounded-lg w-full"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <h3 className="text-xl font-bold mb-2">
                          {latestBreakdown.top_video.title}
                        </h3>
                        <p className="text-zinc-400 mb-4 line-clamp-2">
                          {latestBreakdown.top_video.description}
                        </p>
                        <div className="flex gap-4 text-sm text-zinc-400 mb-6">
                          <span>📺 {formatViews(latestBreakdown.top_video.view_count)} views</span>
                          <span>❤️ {formatViews(latestBreakdown.top_video.like_count || 0)} likes</span>
                        </div>
                        <Link
                          href={`/watch/${latestBreakdown.top_video.id}`}
                          className="btn-primary inline-block"
                        >
                          Watch Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Creator of the Week */}
              {latestBreakdown.top_creator && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span>🌟</span>
                    Creator of the Week
                  </h2>
                  <div className="card p-6">
                    <div className="flex items-center gap-6 mb-6">
                      {latestBreakdown.top_creator.avatar_url && (
                        <Image
                          src={latestBreakdown.top_creator.avatar_url}
                          alt={latestBreakdown.top_creator.display_name}
                          width={80}
                          height={80}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-bold">
                          {latestBreakdown.top_creator.display_name}
                        </h3>
                        <p className="text-zinc-400">
                          @{latestBreakdown.top_creator.username}
                        </p>
                        <p className="text-sm text-zinc-500 mt-2">
                          {latestBreakdown.top_creator.bio}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <div className="text-2xl font-bold text-violet-400">
                          {latestBreakdown.top_creator.follower_count}
                        </div>
                        <p className="text-xs text-zinc-400">Followers</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-violet-400">
                          {latestBreakdown.top_creator.following_count}
                        </div>
                        <p className="text-xs text-zinc-400">Following</p>
                      </div>
                    </div>
                    <Link
                      href={`/creators/${latestBreakdown.top_creator.username}`}
                      className="btn-secondary"
                    >
                      Visit Profile →
                    </Link>
                  </div>
                </div>
              )}

              {/* Past Breakdowns */}
              {pastBreakdowns.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">📚 Past Breakdowns</h2>
                  <div className="space-y-4">
                    {pastBreakdowns.map((breakdown) => (
                      <div key={breakdown.id} className="card p-4 hover:bg-zinc-800/50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-zinc-400 mb-1">
                              Week of {new Date(breakdown.week_start).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-sm line-clamp-2">
                              {breakdown.highlight_text}
                            </p>
                          </div>
                          <Link
                            href={`/breakdown/${breakdown.id}`}
                            className="text-violet-400 hover:text-violet-300 text-xs font-medium whitespace-nowrap ml-4"
                          >
                            Read →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-6">No breakdowns yet. Check back soon!</p>
              <Link href="/" className="btn-primary">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
