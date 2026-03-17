'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Event {
  id: string;
  title: string;
  theme: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  playlist: string[];
  viewer_count: number;
  stream_url?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveEvent, setLiveEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        const eventList = data.events || [];
        
        setEvents(eventList);
        
        // Find live event
        const live = eventList.find((e: Event) => e.status === 'live');
        setLiveEvent(live || null);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const themeColors: Record<string, string> = {
    'sci-fi': '#7c3aed',
    'animation': '#06b6d4',
    'experimental': '#ec4899',
    'documentary': '#8b5cf6',
    'music': '#f59e0b',
    'comedy': '#10b981',
    'horror': '#ef4444',
    'drama': '#6366f1',
  };

  const getThemeColor = (theme: string) => themeColors[theme] || '#7c3aed';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ET`;
    } else if (isTomorrow) {
      return `Tomorrow · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ET`;
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + 
             ` · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ET`;
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 flex items-center gap-3">
              <span className="text-3xl">🎬</span> Mason's Watch Parties
            </h1>
            <p className="text-xl text-zinc-400">
              Mason curates and hosts live AI video screenings. Join the community and discover incredible AI-generated content.
            </p>
          </div>

          {/* Live Event */}
          {liveEvent && (
            <div className="mb-12">
              <div
                className="rounded-xl p-8 border-2 bg-gradient-to-br from-zinc-900 to-zinc-950"
                style={{ borderColor: getThemeColor(liveEvent.theme) }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-semibold text-red-500">LIVE NOW</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-2">{liveEvent.title}</h2>
                <p className="text-zinc-400 mb-4">
                  Mason is hosting now · <span className="text-white font-semibold">{liveEvent.viewer_count.toLocaleString()}</span> viewers
                </p>
                {liveEvent.description && (
                  <p className="text-zinc-300 mb-6">{liveEvent.description}</p>
                )}
                <button
                  className="px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: getThemeColor(liveEvent.theme),
                    color: 'white',
                  }}
                >
                  Watch Live →
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">No upcoming events scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-violet-500/10 group"
                  >
                    {/* Theme color bar */}
                    <div
                      className="h-1"
                      style={{ backgroundColor: getThemeColor(event.theme) }}
                    ></div>

                    <div className="p-6 bg-zinc-900">
                      {/* Event type badge */}
                      <div className="mb-3">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: getThemeColor(event.theme) + '20',
                            color: getThemeColor(event.theme),
                          }}
                        >
                          {event.theme.charAt(0).toUpperCase() + event.theme.slice(1)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold mb-2 group-hover:text-violet-400 transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-sm text-zinc-400 mb-4">
                        {formatDate(event.scheduled_at)}
                      </p>

                      {event.description && (
                        <p className="text-sm text-zinc-300 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                          style={{
                            backgroundColor: getThemeColor(event.theme),
                            color: 'white',
                          }}
                        >
                          Set Reminder
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="mt-16 p-8 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="text-xl font-bold mb-3">🎥 What is Mason's Watch Parties?</h3>
            <p className="text-zinc-300 mb-3">
              Mason hosts curated live screenings of the best AI-generated video content. Each event is themed around a specific AI tool, creative style, or trend, bringing the community together to celebrate the cutting-edge of generative video.
            </p>
            <p className="text-zinc-300">
              Set reminders to be notified when your favorite events go live. Join our community of 100K+ creators and viewers!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
