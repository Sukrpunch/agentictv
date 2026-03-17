'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface ChallengeEntry {
  id: string;
  video_id: string;
  vote_count: number;
  videos: {
    title: string;
    cloudflare_stream_id: string;
    duration_seconds: number;
    channels: {
      display_name: string;
    };
  };
  profiles: {
    username: string;
    avatar_url?: string;
  };
  thumbnail_url: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  rules: string;
  prize_agnt: number;
  starts_at: string;
  ends_at: string;
  voting_ends_at: string;
  computed_status: string;
  winner_video_id?: string;
  created_by: string;
}

interface ChallengeDetail {
  challenge: Challenge;
  entries: ChallengeEntry[];
  winner?: any;
}

export default function ChallengePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${params.id}`);
      if (!res.ok) throw new Error('Failed to load challenge');

      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!selectedVideo) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('sb-auth-token');
      const res = await fetch(`/api/challenges/${params.id}/enter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_id: selectedVideo }),
      });

      if (res.ok) {
        alert('Entry submitted successfully!');
        loadChallenge();
        setSelectedVideo(null);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (entryId: string) => {
    try {
      const token = localStorage.getItem('sb-auth-token');
      const res = await fetch(`/api/challenges/${params.id}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entry_id: entryId }),
      });

      if (res.ok) {
        alert('Vote submitted!');
        loadChallenge();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote');
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="h-12 w-96 bg-zinc-800 rounded animate-pulse mb-8"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-zinc-400">Challenge not found</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { challenge, entries, winner } = data;

  return (
    <>
      <Header />
      <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Challenge Info */}
          <div className="mb-12 rounded-xl border border-violet-500/50 bg-violet-900/10 p-8">
            <h1 className="text-4xl font-black text-white mb-4">{challenge.title}</h1>
            <p className="text-zinc-300 text-lg mb-6">{challenge.description}</p>

            {challenge.rules && (
              <div className="mb-6">
                <h3 className="font-bold text-white mb-2">📋 Rules</h3>
                <p className="text-zinc-400 text-sm">{challenge.rules}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
              <div>
                <div className="text-violet-400 font-bold">{challenge.prize_agnt} AGNT</div>
                <div className="text-zinc-500">Prize</div>
              </div>
              <div>
                <div className="text-green-400 font-bold">
                  {calculateTimeRemaining(challenge.ends_at)}
                </div>
                <div className="text-zinc-500">
                  {challenge.computed_status === 'open' ? 'Entries Close' : 'Voting Ends'}
                </div>
              </div>
              <div>
                <div className="text-blue-400 font-bold">{entries.length}</div>
                <div className="text-zinc-500">Entries</div>
              </div>
              <div>
                <div className={`font-bold ${challenge.computed_status === 'open' ? 'text-green-400' : challenge.computed_status === 'voting' ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {challenge.computed_status.charAt(0).toUpperCase() + challenge.computed_status.slice(1)}
                </div>
                <div className="text-zinc-500">Status</div>
              </div>
            </div>

            {challenge.computed_status === 'open' && (
              <div className="border-t border-violet-500/30 pt-6">
                <h3 className="font-bold text-white mb-4">🎬 Submit Your Entry</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Select one of your videos to submit to this challenge.
                </p>
                {selectedVideo && (
                  <button
                    onClick={handleSubmitEntry}
                    disabled={submitting}
                    className="btn-primary px-6 py-2"
                  >
                    {submitting ? 'Submitting...' : '✓ Submit Entry'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Winner Announcement */}
          {challenge.computed_status === 'complete' && winner && (
            <div className="mb-12 rounded-xl border-2 border-yellow-400 bg-yellow-500/10 p-8">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">🏆</span>
                <div>
                  <h2 className="text-3xl font-black text-yellow-400">Challenge Winner!</h2>
                  <p className="text-zinc-400">Congratulations to the creator</p>
                </div>
              </div>
              <Link
                href={`/watch/${winner.id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-900/60 transition-all"
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={winner.thumbnail_url}
                    alt={winner.title}
                    className="w-24 h-14 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{winner.title}</h3>
                    <p className="text-sm text-zinc-400">
                      @{winner.channels.display_name}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Entries Grid */}
          {entries.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {challenge.computed_status === 'voting' || challenge.computed_status === 'complete'
                  ? '🗳️ Entries & Votes'
                  : '👀 Browse Entries'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden hover:border-violet-500/50 transition-all"
                  >
                    <Link href={`/watch/${entry.video_id}`} className="block">
                      <div className="relative overflow-hidden aspect-video bg-black">
                        <img
                          src={entry.thumbnail_url}
                          alt={entry.videos.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                          {formatDuration(entry.videos.duration_seconds)}
                        </div>
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link href={`/watch/${entry.video_id}`} className="block mb-2">
                        <h3 className="font-bold text-white hover:text-violet-400 transition-colors line-clamp-2">
                          {entry.videos.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-zinc-400 mb-4">
                        @{entry.profiles.username}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-violet-400 font-bold">
                          🗳️ {entry.vote_count} votes
                        </div>
                        {challenge.computed_status === 'voting' && (
                          <button
                            onClick={() => handleVote(entry.id)}
                            className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            Vote
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entries.length === 0 && challenge.computed_status !== 'complete' && (
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">No entries yet. Be the first to submit!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
