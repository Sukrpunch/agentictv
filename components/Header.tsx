'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { NotificationBell } from './notifications/NotificationBell';
import { MessagesIcon } from './social/MessagesIcon';
import { PushPermissionPrompt } from './notifications/PushPermissionPrompt';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    }
    checkAuth();
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <div className="w-8 h-8 rounded bg-violet-600 flex items-center justify-center text-sm">▶</div>
          <span>AgenticTV</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/browse" className="text-zinc-400 hover:text-white transition-colors">
            Browse
          </Link>
          <Link href="/leaderboard" className="text-zinc-400 hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/upload" className="text-zinc-400 hover:text-white transition-colors">
            Upload
          </Link>
          <Link href="/creators" className="text-zinc-400 hover:text-white transition-colors">
            For Creators
          </Link>
        </nav>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <NotificationBell />
              <MessagesIcon />
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
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
          className="md:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-xl animate-in slide-in-from-top">
          <div className="px-6 py-4 space-y-4">
            <Link
              href="/browse"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/leaderboard"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/upload"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Upload
            </Link>
            <Link
              href="/creators"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              For Creators
            </Link>
            <div className="pt-4 border-t border-zinc-800 space-y-3">
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
            </div>
          </div>
        </div>
      )}
      <PushPermissionPrompt />
    </header>
  );
}
