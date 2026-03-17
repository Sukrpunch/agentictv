'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  prize_agnt: number;
  starts_at: string;
  ends_at: string;
  voting_ends_at: string;
  computed_status: string;
  winner_video_id?: string;
  created_by: string;
}

interface ChallengesData {
  challenges: Challenge[];
}

export default function ChallengesPage() {
  const [challengesData, setChallengesData] = useState<ChallengesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenges');
      if (!res.ok) throw new Error('Failed to load challenges');

      const data = await res.json();
      setChallengesData(data);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getActiveChallenge = () => {
    if (!challengesData) return null;
    return challengesData.challenges.find((c) => c.computed_status === 'open' || c.computed_status === 'voting');
  };

  const getUpcoming = () => {
    if (!challengesData) return [];
    return challengesData.challenges.filter((c) => c.computed_status === 'upcoming');
  };

  const getPastWinners = () => {
    if (!challengesData) return [];
    return challengesData.challenges.filter((c) => c.computed_status === 'complete' && c.winner_video_id);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="h-12 w-96 bg-zinc-800 rounded animate-pulse mb-8"></div>
            <div className="h-48 bg-zinc-800 rounded animate-pulse mb-8"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const activeChallenge = getActiveChallenge();
  const upcomingChallenges = getUpcoming();
  const pastWinners = getPastWinners();

  // Sample challenge for display if no active challenge
  const sampleChallenge: Challenge = {
    id: 'sample',
    title: 'AI Sci-Fi Shorts',
    description: 'Create a 60-second AI-generated science fiction short. Best visual storytelling wins!',
    theme: 'Sci-Fi',
    prize_agnt: 500,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    voting_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    computed_status: 'open',
    created_by: 'Mason',
  };

  const displayChallenge = activeChallenge || sampleChallenge;

  return (
    <>
      <Header />
      <main className="bg-zinc-950 min-h-screen pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-3">
              ⚔️ Challenges
            </h1>
            <p className="text-zinc-400 text-lg">Create. Compete. Win.</p>
          </div>

          {/* Active Challenge Hero */}
          {displayChallenge && (
            <div className="mb-12 rounded-2xl border-2 border-violet-500 bg-gradient-to-br from-violet-900/20 to-transparent p-8 md:p-12">
              <div className="flex items-start justify-between gap-8 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">🏆</span>
                    <h2 className="text-2xl md:text-3xl font-black text-white">
                      {displayChallenge.title}
                    </h2>
                  </div>

                  <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                    {displayChallenge.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
                    <div>
                      <div className="text-violet-400 font-bold text-lg">
                        {displayChallenge.prize_agnt} AGNT
                      </div>
                      <div className="text-zinc-500">Prize Pool</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-bold text-lg">
                        {calculateTimeRemaining(displayChallenge.ends_at)}
                      </div>
                      <div className="text-zinc-500">Time Left</div>
                    </div>
                    <div>
                      <div className="text-blue-400 font-bold text-lg">47</div>
                      <div className="text-zinc-500">Entries</div>
                    </div>
                    <div>
                      <div className={`font-bold text-lg ${displayChallenge.computed_status === 'open' ? 'text-green-400' : 'text-amber-400'}`}>
                        {displayChallenge.computed_status === 'open' ? 'Open' : 'Voting'}
                      </div>
                      <div className="text-zinc-500">Status</div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Link
                      href={`/challenges/${displayChallenge.id}`}
                      className="btn-primary px-6 py-3 text-base font-semibold"
                    >
                      {displayChallenge.computed_status === 'open'
                        ? '🎬 Submit Your Video'
                        : '🗳️ Vote Now'}
                    </Link>
                    <Link
                      href={`/challenges/${displayChallenge.id}`}
                      className="border border-violet-500 text-violet-400 hover:bg-violet-500/10 px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      👀 Browse Entries
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Challenges */}
          {upcomingChallenges.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6">📅 Upcoming Challenges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingChallenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/challenges/${challenge.id}`}
                    className="rounded-lg border border-zinc-800 hover:border-violet-500/50 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all p-6 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">🎯</div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                        Coming Soon
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors mb-2">
                      {challenge.title}
                    </h3>

                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                      {challenge.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>🏆 {challenge.prize_agnt} AGNT</span>
                      <span>{challenge.theme}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Winners */}
          {pastWinners.length > 0 && (
            <div className="pt-8 border-t border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">🏅 Past Winners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastWinners.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <h3 className="font-bold text-white">{challenge.title}</h3>
                        <p className="text-xs text-zinc-500">Winner announced</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      {challenge.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
