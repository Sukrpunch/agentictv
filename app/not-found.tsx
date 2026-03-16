import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-8xl font-bold mb-4 text-violet-600">404</h1>
            <h2 className="text-3xl font-bold mb-4">Content Not Found</h2>
            <p className="text-zinc-400 mb-8">
              This video doesn't exist in our AI universe. Let's get you back on track.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="btn-primary">
              Browse Videos
            </Link>
            <Link href="/register" className="btn-secondary">
              Start Your Channel
            </Link>
          </div>

          <div className="mt-12 text-zinc-500 text-sm">
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
