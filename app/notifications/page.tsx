'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';

interface Notification {
  id: string;
  message: string;
  type: string;
  entity_id: string;
  entity_type: string;
  read: boolean;
  created_at: string;
  actor?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 20;

  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);
      fetchNotifications(0);
    }

    initAuth();
  }, [router]);

  async function fetchNotifications(pageNum: number) {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(
        `/api/notifications?limit=${pageSize}&offset=${pageNum * pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 0) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        } else {
          setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        }

        setHasMore((data.notifications || []).length === pageSize);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      });

      if (response.ok) {
        setUnreadCount(0);
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [notificationId] }),
      });

      setNotifications(notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  function getNotificationLink(notif: Notification): string {
    if (notif.entity_type === 'profile') {
      return `/creators/${notif.actor?.username || ''}`;
    } else if (notif.entity_type === 'video') {
      return `/watch/${notif.entity_id}`;
    } else if (notif.entity_type === 'message') {
      return `/messages/${notif.entity_id}`;
    }
    return '#';
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case 'follow': return '👤';
      case 'comment': return '💬';
      case 'reply': return '💬';
      case 'collab_invite': return '🤝';
      case 'remix': return '🔄';
      default: return '📢';
    }
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Notifications</h1>
              <p className="text-zinc-400">Stay updated on what's happening</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors text-sm"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mb-4 text-4xl">✓</div>
              <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
              <p className="text-zinc-400 mb-6">No notifications right now. Check back later.</p>
              <Link href="/browse" className="btn-primary inline-block">
                Browse Videos
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-0 border border-zinc-800 rounded-lg overflow-hidden">
                {notifications.map((notif, idx) => (
                  <Link
                    key={notif.id}
                    href={getNotificationLink(notif)}
                    onClick={() => {
                      if (!notif.read) {
                        markAsRead(notif.id);
                      }
                    }}
                  >
                    <div
                      className={`px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-violet-600/10' : ''
                      } ${idx === notifications.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        {notif.actor?.avatar_url ? (
                          <img
                            src={notif.actor.avatar_url}
                            alt={notif.actor.display_name}
                            className="w-12 h-12 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-violet-600/30 flex items-center justify-center text-lg font-bold flex-shrink-0">
                            {notif.actor?.display_name?.charAt(0) || 'A'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-white text-base">
                              {notif.message}
                            </p>
                            <span className="text-2xl flex-shrink-0 ml-4">
                              {getNotificationIcon(notif.type)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 mt-2">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>

                        {!notif.read && (
                          <div className="w-3 h-3 rounded-full bg-violet-600 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      fetchNotifications(nextPage);
                    }}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
