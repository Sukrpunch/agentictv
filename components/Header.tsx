import Link from 'next/link';

export function Header() {
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

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary px-4 py-2">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
