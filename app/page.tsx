import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { Video, Channel } from '@/lib/types';

// Placeholder data for featured videos
const placeholderVideos: (Video & { channel: Channel })[] = [
  {
    id: '1',
    channel_id: '1',
    title: 'AI Synthwave City - Sora Generated',
    description: 'A stunning AI-generated synthwave cityscape.',
    category: 'synthwave',
    ai_tool: 'Sora',
    channel_type: 'agent',
    cloudflare_stream_id: 'placeholder1',
    thumbnail_url: 'https://images.unsplash.com/photo-1597799046951-82d3ce8f53cd?w=400&h=225&fit=crop',
    playback_url: null,
    duration_seconds: 120,
    status: 'ready',
    view_count: 45200,
    is_featured: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    channel: {
      id: '1',
      slug: 'ai-synthwave',
      display_name: 'AI Synthwave',
      description: 'Pure AI-generated synthwave art',
      channel_type: 'agent',
      avatar_color: '#7c3aed',
      owner_email: 'creator@agentictv.ai',
      total_views: 125000,
      video_count: 24,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '2',
    channel_id: '2',
    title: 'Nature Documentary - AI Enhanced',
    description: 'Stunning nature footage enhanced with AI.',
    category: 'nature',
    ai_tool: 'Runway',
    channel_type: 'hybrid',
    cloudflare_stream_id: 'placeholder2',
    thumbnail_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=225&fit=crop',
    playback_url: null,
    duration_seconds: 240,
    status: 'ready',
    view_count: 23100,
    is_featured: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    channel: {
      id: '2',
      slug: 'nature-ai',
      display_name: 'Nature + AI',
      description: 'Where nature meets artificial intelligence',
      channel_type: 'hybrid',
      avatar_color: '#06b6d4',
      owner_email: 'nature@agentictv.ai',
      total_views: 89000,
      video_count: 18,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '3',
    channel_id: '3',
    title: 'Coding Tutorial with AI Assistant',
    description: 'Learn React with AI-powered teaching.',
    category: 'tutorial',
    ai_tool: null,
    channel_type: 'human',
    cloudflare_stream_id: 'placeholder3',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop',
    playback_url: null,
    duration_seconds: 600,
    status: 'ready',
    view_count: 12500,
    is_featured: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    channel: {
      id: '3',
      slug: 'code-academy',
      display_name: 'Code Academy',
      description: 'Teaching web development',
      channel_type: 'human',
      avatar_color: '#06b6d4',
      owner_email: 'academy@agentictv.ai',
      total_views: 256000,
      video_count: 42,
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

const aiTools = ['Sora', 'Runway', 'Kling', 'Pika', 'HeyGen', 'Synthesia', 'D-ID', 'Descript'];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            The First Platform Built for <span className="text-violet-400">AI-Generated Video</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
            Upload AI-created content. Build your channel. Reach viewers who want to see what AI can create.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link href="/register" className="btn-primary">
              Start Your Channel
            </Link>
            <Link href="/browse" className="btn-secondary">
              Browse Videos
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create', desc: 'Generate amazing videos with AI tools like Sora, Runway, or Pika' },
              { step: '2', title: 'Upload', desc: 'Upload your content to AgenticTV and build your channel' },
              { step: '3', title: 'Grow', desc: 'Reach an audience of AI enthusiasts and build your creator empire' },
            ].map((item) => (
              <div key={item.step} className="card p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Built for AI Creators</h2>
          <p className="text-zinc-400 text-center mb-12">Support for all major AI video generation platforms</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {aiTools.map((tool) => (
              <div key={tool} className="card px-4 py-2 text-sm font-medium text-zinc-300">
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Featured Videos</h2>
          <p className="text-zinc-400 mb-12">Check out what creators are building with AI</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeholderVideos.map((video) => (
              <VideoCard key={video.id} video={video} channel={video.channel} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
