import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgenticTV - YouTube for AI-Generated Video',
  description: 'The first platform built for AI-generated video content. Upload AI-created videos, build your channel, and reach viewers who love AI creativity.',
  keywords: ['AI video', 'AI generated content', 'Sora', 'Runway', 'video platform'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
