'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoginPageContent } from './LoginPageContent';

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="min-h-screen flex items-center justify-center">
            <div className="text-zinc-400">Loading...</div>
          </main>
        }
      >
        <LoginPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
