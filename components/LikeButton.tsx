'use client';

import { useState, useEffect } from 'react';
import { formatCount } from '@/lib/utils';

interface LikeButtonProps {
  videoId: string;
  initialLikes: number;
}

export function LikeButton({ videoId, initialLikes }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  // Initialize fingerprint from localStorage
  useEffect(() => {
    const storedFp = localStorage.getItem('atv_fp');
    if (storedFp) {
      setFingerprint(storedFp);
    } else {
      const newFp = crypto.randomUUID();
      localStorage.setItem('atv_fp', newFp);
      setFingerprint(newFp);
    }
  }, []);

  // Check if user has liked this video
  useEffect(() => {
    if (!fingerprint) return;

    async function checkLike() {
      try {
        const response = await fetch(`/api/videos/${videoId}/like-status?fp=${fingerprint}`);
        if (response.ok) {
          const data = await response.json();
          setLiked(data.liked);
        }
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    }

    checkLike();
  }, [videoId, fingerprint]);

  const handleLike = async () => {
    if (!fingerprint || loading) return;

    setLoading(true);
    try {
      const action = liked ? 'unlike' : 'like';
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, action }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikes(data.likes);
      }
    } catch (err) {
      console.error('Error updating like:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading || !fingerprint}
      className={`flex items-center gap-1.5 text-sm cursor-pointer transition-colors ${
        liked
          ? 'text-red-500'
          : 'text-zinc-400 hover:text-red-400'
      }`}
    >
      {liked ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
      <span>{formatCount(likes)}</span>
    </button>
  );
}
