'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCount } from '@/lib/utils';

interface TipButtonProps {
  videoId: string;
  creatorId: string;
  creatorUsername: string;
  watchSeconds?: number;
}

export function TipButton({
  videoId,
  creatorId,
  creatorUsername,
  watchSeconds = 0,
}: TipButtonProps) {
  const { user } = useAuth();
  const [tipCount, setTipCount] = useState(0);
  const [hasTipped, setHasTipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipped, setTipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show tip button if viewer is creator
  if (user?.id === creatorId) {
    return null;
  }

  // Only show for logged-in users
  if (!user) {
    return null;
  }

  // Fetch tip data on mount
  useEffect(() => {
    async function fetchTipData() {
      try {
        const headers: HeadersInit = {};
        if (user?.id) {
          const { data: { session } } = await (window as any).supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        }

        const res = await fetch(`/api/tips?video_id=${videoId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setTipCount(data.tipCount);
          setHasTipped(data.hasTipped);
        }
      } catch (err) {
        console.error('Error fetching tip data:', err);
      }
    }

    if (user?.id) {
      fetchTipData();
    }
  }, [videoId, user?.id]);

  const handleTip = async () => {
    if (!user || hasTipped || loading || watchSeconds < 30) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await (window as any).supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ video_id: videoId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send tip');
        return;
      }

      // Success
      setTipped(true);
      setHasTipped(true);
      setTipCount(tipCount + 1);

      // Reset animation after 2 seconds
      setTimeout(() => {
        setTipped(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error sending tip');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = hasTipped || loading || watchSeconds < 30;
  const buttonText =
    watchSeconds < 30
      ? 'Watch for 30s first'
      : hasTipped
        ? 'Already tipped today'
        : tipped
          ? 'Tipped! ✨'
          : 'Tip 10 AGNT';

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleTip}
        disabled={isDisabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isDisabled
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
            : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
        } ${tipped ? 'animate-pulse' : ''}`}
        title={
          watchSeconds < 30
            ? `Watch ${Math.ceil(30 - watchSeconds)} more seconds`
            : hasTipped
              ? 'You can tip again tomorrow'
              : 'Send a tip to support this creator'
        }
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.868 3.00a.5.5 0 01.504.308l.012.063 1.352 6.395H17.5a.5.5 0 01.09.992l-.09.008h-5.598l-.687 3.25h4.285a.5.5 0 01.09.992l-.09.008H10.44l-1.352 6.395a.5.5 0 01-.504.308.5.5 0 01-.45-.292l-.054-.108L2.128 3.5a.5.5 0 01.868-.504l6.872 10.004V3.616a.5.5 0 01.5-.5z" />
        </svg>
        <span>{buttonText}</span>
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {tipCount > 0 && (
        <p className="text-xs text-zinc-400">
          💰 {formatCount(tipCount)} tip{tipCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
