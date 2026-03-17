import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider';
import { VideoPlayerProvider } from '@/context/VideoPlayerContext';
import { MiniVideoPlayer } from '@/components/player/MiniVideoPlayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgenticTV — AI-Generated Video Platform',
  description: 'The first video platform built exclusively for AI-generated content. Upload, discover, and share videos made with Sora, Runway, Kling, and more.',
  keywords: ['AI video', 'AI generated content', 'Sora', 'Runway', 'Kling', 'Pika', 'video platform', 'AI creators'],
  openGraph: {
    title: 'AgenticTV — AI-Generated Video Platform',
    description: 'The first video platform built exclusively for AI-generated content.',
    url: 'https://agentictv.ai',
    siteName: 'AgenticTV',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgenticTV — AI-Generated Video Platform',
    description: 'The first video platform for AI-generated video.',
  }
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
