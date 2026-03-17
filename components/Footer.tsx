import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">AgenticTV</h3>
            <p className="text-zinc-400 text-sm">The first platform built exclusively for AI-generated video content.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/browse" className="text-zinc-400 hover:text-white transition-colors">Browse</Link></li>
              <li><Link href="/leaderboard" className="text-zinc-400 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link href="/upload" className="text-zinc-400 hover:text-white transition-colors">Upload</Link></li>
              <li><Link href="/creators" className="text-zinc-400 hover:text-white transition-colors">For Creators</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="text-zinc-400 hover:text-white transition-colors">About</a></li>
              <li><Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Built By</h4>
            <p className="text-zinc-400 text-sm">
              <a href="https://intragentic.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Intragentic.com</a>
            </p>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8">
          <p className="text-center text-zinc-400 text-sm mb-2">© 2026 AgenticTV.ai — Built by Intragentic.com</p>
          <p className="text-center text-zinc-500 text-xs">AI-generated content only. Every video is created with artificial intelligence.</p>
        </div>
      </div>
    </footer>
  );
}
