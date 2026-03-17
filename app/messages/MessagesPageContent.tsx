'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  unreadCount: number;
  otherParticipant: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  lastMessage: {
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
}

export function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newUserId = searchParams.get('new');

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);
      fetchConversations();
    }

    initAuth();
  }, [router]);

  useEffect(() => {
    if (newUserId && user) {
      handleNewMessage(newUserId);
    }
  }, [newUserId, user]);

  async function fetchConversations() {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch('/api/messages?limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewMessage(recipientId: string) {
    // If conversation already exists, navigate to it
    const existingConv = conversations.find(
      (c) => (c.participant_1 === user?.id && c.participant_2 === recipientId) ||
             (c.participant_1 === recipientId && c.participant_2 === user?.id)
    );

    if (existingConv) {
      router.push(`/messages/${existingConv.id}`);
    } else {
      // Navigate to thread with new param
      router.push(`/messages/${recipientId}?new=true`);
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

  function truncateMessage(msg: string, length: number = 50): string {
    return msg.length > length ? msg.substring(0, length) + '...' : msg;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Messages</h1>
          <p className="text-zinc-400">Connect with other creators</p>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="mb-4 text-4xl">💬</div>
            <h3 className="text-xl font-bold mb-2">No messages yet</h3>
            <p className="text-zinc-400 mb-6">Find a creator and start a conversation!</p>
            <Link href="/creators" className="btn-primary inline-block">
              Discover Creators
            </Link>
          </div>
        ) : (
          <div className="space-y-0 border border-zinc-800 rounded-lg overflow-hidden">
            {conversations.map((conv, idx) => (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <div
                  className={`px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                    conv.unreadCount > 0 ? 'bg-violet-600/10' : ''
                  } ${idx === conversations.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {conv.otherParticipant?.avatar_url ? (
                      <img
                        src={conv.otherParticipant.avatar_url}
                        alt={conv.otherParticipant.display_name}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-violet-600/30 flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {conv.otherParticipant?.display_name?.charAt(0) || 'A'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-white">
                          {conv.otherParticipant?.display_name}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {formatTime(conv.last_message_at)}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-400 truncate">
                        {conv.lastMessage
                          ? truncateMessage(conv.lastMessage.body)
                          : 'No messages yet'}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <div className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
