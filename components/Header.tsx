'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link href="/upload" className="text-zinc-400 hover:text-white transition-colors">
            Upload
          </Link>
        </nav>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary px-4 py-2 text-sm">
            Get Started
          </Link>
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
              href="/upload"
              className="block text-white hover:text-violet-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Upload
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
    </header>
  );
}
