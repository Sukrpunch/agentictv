'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

interface Message {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  sender?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
}

export function MessageThreadContent({
  params,
}: {
  params: { conversationId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = params.conversationId;

  // Check if conversationId is a UUID (existing conversation) or userId (new conversation)
  const isExistingConversation = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
    conversationId.toLowerCase()
  );

  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      if (isExistingConversation) {
        fetchMessages(conversationId, authUser.id);
      } else {
        // New conversation with userId
        setLoading(false);
      }
    }

    initAuth();
  }, [router, conversationId, isExistingConversation]);

  async function fetchMessages(convId: string, userId: string) {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/messages/${convId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConversation(data.conversation);

        // Check if user is participant
        if (
          data.conversation.participant_1 !== userId &&
          data.conversation.participant_2 !== userId
        ) {
          router.push('/messages');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!messageInput.trim()) return;

    setSending(true);

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      // Determine recipient ID
      let recipientId = '';
      if (isExistingConversation) {
        // Get recipient from conversation
        recipientId =
          conversation.participant_1 === user.id
            ? conversation.participant_2
            : conversation.participant_1;
      } else {
        // conversationId is the recipient ID
        recipientId = conversationId;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          body: messageInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // If this was a new conversation, update the URL
        if (!isExistingConversation) {
          router.push(`/messages/${data.conversation.id}`);
        }

        // Add new message to list
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            body: data.message.body,
            sender_id: user.id,
            created_at: data.message.created_at,
            sender: {
              display_name: '', // Will be filled on refresh
              username: '',
              avatar_url: '',
            },
          },
        ]);

        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (!user) {
    return null;
  }

  if (!isExistingConversation && loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  // Get other participant
  const otherParticipantId =
    conversation && conversation.participant_1 === user.id
      ? conversation.participant_2
      : !isExistingConversation
        ? conversationId
        : conversation?.participant_1;

  return (
    <>
      <Header />

      <main className="min-h-screen flex flex-col px-6 py-8 bg-zinc-950">
        <div className="max-w-3xl mx-auto w-full flex flex-col h-[calc(100vh-120px)]">
          {/* Back button */}
          <Link
            href="/messages"
            className="text-violet-400 hover:text-violet-300 transition-colors mb-4 text-sm"
          >
            ← Back to Messages
          </Link>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-zinc-400">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-400">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      message.sender_id === user.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-800 text-zinc-100'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender_id === user.id
                          ? 'text-violet-200'
                          : 'text-zinc-400'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-600 text-white placeholder-zinc-500 transition-colors"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sending}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
