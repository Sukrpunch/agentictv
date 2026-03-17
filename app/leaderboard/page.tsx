'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { formatViews } from '@/lib/utils';

interface TopVideo {
  id: string;
  title: string;
  view_count: number;
  like_count?: number;
  channel: {
    slug: string;
    display_name: string;
  };
}

interface TopChannel {
  id: string;
  slug: string;
  display_name: string;
  total_views: number;
  video_count: number;
}

type ActiveTab = 'videos' | 'channels';

const getMedalEmoji = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

const getMedalColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'text-yellow-400';
    case 2:
      return 'text-gray-300';
    case 3:
      return 'text-orange-400';
    default:
      return 'text-white';
  }
};

const getBadgeBg = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'bg-yellow-500/10';
    case 2:
      return 'bg-gray-500/10';
    case 3:
      return 'bg-orange-500/10';
    default:
      return 'bg-zinc-900/50';
  }
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('videos');
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [topChannels, setTopChannels] = useState<TopChannel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const [videosRes, channelsRes] = await Promise.all([
        fetch('/api/leaderboard/videos'),
        fetch('/api/leaderboard/channels'),
      ]);

      if (videosRes.ok) {
        const data = await videosRes.json();
        setTopVideos(data);
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setTopChannels(data);
      }
    } catch (err) {
      console.error('Error loading leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2">Leaderboard</h1>
            <p className="text-xl text-zinc-400">
              The most-watched videos and trending creators on AgenticTV
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-12 border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-0 py-4 text-lg font-semibold transition-colors border-b-2 ${
                activeTab === 'videos'
                  ? 'text-white border-violet-400'
                  : 'text-zinc-400 border-transparent hover:text-white'
              }`}
            >
              Top Videos
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-0 py-4 text-lg font-semibold transition-colors border-b-2 ${
                activeTab === 'channels'
                  ? 'text-white border-violet-400'
                  : 'text-zinc-400 border-transparent hover:text-white'
              }`}
            >
              Top Channels
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">Loading...</p>
            </div>
          ) : activeTab === 'videos' ? (
            <div className="space-y-4">
              {topVideos.map((video, idx) => {
                const rank = idx + 1;
                const medal = getMedalEmoji(rank);
                const medalColor = getMedalColor(rank);
                const badgeBg = getBadgeBg(rank);

                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className={`block p-6 rounded-xl border border-zinc-800 hover:border-violet-600 transition ${badgeBg} hover:bg-zinc-900/70`}
                  >
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className={`flex-shrink-0 text-3xl ${medalColor} font-bold`}>
                        {medal || `#${rank}`}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate mb-2">
                          {video.title}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          by{' '}
                          <Link
                            href={`/channel/${video.channel.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-violet-400 hover:text-violet-300"
                          >
                            {video.channel.display_name}
                          </Link>
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-white">
                          {formatViews(video.view_count)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {video.like_count || 0} likes
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {topVideos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-400">No videos yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {topChannels.map((channel, idx) => {
                const rank = idx + 1;
                const medal = getMedalEmoji(rank);
                const medalColor = getMedalColor(rank);
                const badgeBg = getBadgeBg(rank);

                return (
                  <Link
                    key={channel.id}
                    href={`/channel/${channel.slug}`}
                    className={`block p-6 rounded-xl border border-zinc-800 hover:border-violet-600 transition ${badgeBg} hover:bg-zinc-900/70`}
                  >
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className={`flex-shrink-0 text-3xl ${medalColor} font-bold`}>
                        {medal || `#${rank}`}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate mb-2">
                          {channel.display_name}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          {channel.video_count} video{channel.video_count !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-white">
                          {formatViews(channel.total_views)}
                        </div>
                        <div className="text-xs text-zinc-500">total views</div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {topChannels.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-400">No channels yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
