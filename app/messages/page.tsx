'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';
import { MessagesPageContent } from './MessagesPageContent';

export default function MessagesPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="min-h-screen px-6 py-12">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Messages</h1>
                <p className="text-zinc-400">Connect with other creators</p>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        }
      >
        <MessagesPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
