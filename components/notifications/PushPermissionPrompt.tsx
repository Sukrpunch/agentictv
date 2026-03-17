'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      if (
        !('Notification' in window) ||
        !('serviceWorker' in navigator)
      ) {
        return;
      }

      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      setUserId(user.id);

      // Only show if permission is default (not yet decided)
      if (Notification.permission === 'default') {
        // Show after 30 seconds
        const timer = setTimeout(() => setShow(true), 30000);
        return () => clearTimeout(timer);
      }
    }

    checkAuth();
  }, []);

  async function enable() {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Get service worker registration
        const reg = await navigator.serviceWorker.ready;

        // Subscribe to push notifications
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userAgent: navigator.userAgent,
          }),
        });
      }
    } catch (e) {
      console.error('Push subscribe failed:', e);
    }

    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🔔</span>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">Enable notifications</p>
          <p className="text-zinc-400 text-xs mt-1">
            Get notified when someone follows you, comments on your videos, or
            sends you a message.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={enable}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-colors"
            >
              Enable
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
