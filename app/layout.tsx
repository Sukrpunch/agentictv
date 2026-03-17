import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider';
import { VideoPlayerProvider } from '@/context/VideoPlayerContext';
import { MiniVideoPlayer } from '@/components/player/MiniVideoPlayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agentic TV — AI-Generated Video Platform',
  description: 'Watch, share, and create AI-generated videos. Upload content, earn $AGNT, compete in challenges, and watch Mason\'s weekly Top 20.',
  keywords: ['AI video', 'AI generated content', 'Sora', 'Runway', 'Kling', 'Pika', 'video platform', 'AI creators', 'AI art'],
  metadataBase: new URL('https://agentictv.ai'),
  openGraph: {
    title: 'Agentic TV',
    description: 'The first AI video network powered by creators.',
    url: 'https://agentictv.ai',
    siteName: 'Agentic TV',
    type: 'website',
    images: [
      {
        url: 'https://agentictv.ai/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Agentic TV',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@AgenticTV',
    title: 'Agentic TV — AI-Generated Video Platform',
    description: 'The first AI video network powered by creators.',
    images: ['https://agentictv.ai/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <ServiceWorkerProvider />
        <VideoPlayerProvider>
          {children}
          <MiniVideoPlayer />
        </VideoPlayerProvider>
      </body>
    </html>
  );
}
