'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

interface FollowButtonProps {
  targetUserId: string;
  initialFollowerCount?: number;
  displayName?: string;
}

export function FollowButton({
  targetUserId,
  initialFollowerCount = 0,
  displayName,
}: FollowButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Check if currently following
      if (authUser) {
        try {
          const response = await fetch(
            `/api/social/follow?target_user_id=${targetUserId}&current_user_id=${authUser.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setIsFollowing(data.isFollowing);
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, [targetUserId]);

  async function handleToggleFollow() {
    if (!user) {
      router.push('/login');
      return;
    }

    // Don't allow following yourself
    if (user.id === targetUserId) {
      return;
    }

    setLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch('/api/social/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });

      if (!response.ok) throw new Error('Failed to update follow status');

      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      setFollowerCount((prev) =>
        newFollowState ? prev + 1 : Math.max(0, prev - 1)
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  }

  // Hide follow button if viewing own profile
  if (user?.id === targetUserId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleFollow}
        disabled={loading || !user}
        className={`px-6 py-2 rounded-lg font-medium transition-all ${
          isFollowing
            ? 'bg-violet-600 text-white hover:bg-violet-700'
            : 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isFollowing ? '✓ Following' : 'Follow'}
      </button>
      <div className="text-sm text-zinc-400">
        {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
      </div>
    </div>
  );
}
