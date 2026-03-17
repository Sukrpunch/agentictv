'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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

export function NotificationBell() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user and notifications on mount
  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        fetchNotifications(authUser.id);
        
        // Poll every 60 seconds
        const interval = setInterval(() => {
          fetchNotifications(authUser.id);
        }, 60000);
        
        return () => clearInterval(interval);
      }
      
      setLoading(false);
    }

    initAuth();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  async function fetchNotifications(userId: string) {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
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
        setNotifications(notifications.map(n => ({ ...n, read: true })));
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

      setNotifications(notifications.map(n => 
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
    return '/notifications';
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationLink(notif)}
                  onClick={() => {
                    setDropdownOpen(false);
                    if (!notif.read) {
                      markAsRead(notif.id);
                    }
                  }}
                >
                  <div
                    className={`px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                      !notif.read ? 'bg-violet-600/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notif.actor?.avatar_url ? (
                        <img
                          src={notif.actor.avatar_url}
                          alt={notif.actor.display_name}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {notif.actor?.display_name?.charAt(0) || 'A'}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>

                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800">
            <Link
              href="/notifications"
              onClick={() => setDropdownOpen(false)}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
