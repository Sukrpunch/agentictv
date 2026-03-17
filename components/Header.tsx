'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { NotificationBell } from './notifications/NotificationBell';
import { MessagesIcon } from './social/MessagesIcon';
import { PushPermissionPrompt } from './notifications/PushPermissionPrompt';

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    }
    checkAuth();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold flex-shrink-0">
          <div className="w-8 h-8 rounded bg-violet-600 flex items-center justify-center text-sm">▶</div>
          <span className="hidden sm:inline">AgenticTV</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 mx-8">
          <Link href="/browse" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            Browse
          </Link>
          <Link href="/charts" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            🎬 Charts
          </Link>
          <Link href="/trending" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            🔥 Trending
          </Link>
          <Link href="/challenges" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            ⚔️ Challenges
          </Link>
          <Link href="/leaderboard" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            Leaderboard
          </Link>
          <Link href="/breakdown" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            📊 Breakdown
          </Link>
          <Link href="/events" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            🎬 Events
          </Link>
          <Link href="/prompts" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            📝 Prompts
          </Link>
          <Link href="/community-channels" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            📺 Channels
          </Link>
          {user && (
            <>
              <Link href="/upload" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
                Upload
              </Link>
              <Link href="/library" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
                Library
              </Link>
              <Link href="/history" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
                History
              </Link>
              <Link href="/playlists" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
                Playlists
              </Link>
            </>
          )}
          <Link href="/creators" className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap">
            For Creators
          </Link>
        </nav>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search videos, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-600 transition-colors text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {/* Search Icon - Mobile */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden text-zinc-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {user ? (
            <>
              <NotificationBell />
              <MessagesIcon />
              <div className="h-6 w-px bg-zinc-700" />
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white flex-shrink-0"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden px-6 py-3 border-t border-zinc-800">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search videos, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-600 transition-colors text-sm"
            />
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-xl animate-in slide-in-from-top">
          <div className="px-6 py-4 space-y-4">
            <Link
              href="/browse"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/charts"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🎬 Charts
            </Link>
            <Link
              href="/trending"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🔥 Trending
            </Link>
            <Link
              href="/challenges"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              ⚔️ Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/breakdown"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              📊 Breakdown
            </Link>
            <Link
              href="/events"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🎬 Events
            </Link>
            <Link
              href="/prompts"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              📝 Prompts
            </Link>
            <Link
              href="/community-channels"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              📺 Channels
            </Link>
            {user && (
              <>
                <Link
                  href="/upload"
                  className="block text-white hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Upload
                </Link>
                <Link
                  href="/library"
                  className="block text-white hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Library
                </Link>
                <Link
                  href="/history"
                  className="block text-white hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  History
                </Link>
                <Link
                  href="/playlists"
                  className="block text-white hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Playlists
                </Link>
              </>
            )}
            <Link
              href="/creators"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              For Creators
            </Link>
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-white hover:text-violet-400 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      const supabase = getSupabase();
                      await supabase.auth.signOut();
                      setUser(null);
                      setMobileMenuOpen(false);
                      router.push('/');
                    }}
                    className="block text-white hover:text-violet-400 transition-colors w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-white hover:text-violet-400 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary w-full text-center block py-2 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <PushPermissionPrompt />
    </header>
  );
}
