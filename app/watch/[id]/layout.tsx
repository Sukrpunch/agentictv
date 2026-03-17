import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data: video } = await supabase
      .from('videos')
      .select('*, channels(display_name, avatar_url)')
      .eq('id', params.id)
      .single();

    if (!video) {
      return {
        title: 'Video Not Found — Agentic TV',
        description: 'This video could not be found on Agentic TV.',
      };
    }

    const creatorName = Array.isArray(video.channels) ? video.channels[0]?.display_name : video.channels?.display_name || 'Unknown Creator';
    
    // Use Cloudflare thumbnail if available
    const thumbnail = video.cloudflare_video_id
      ? `https://videodelivery.net/${video.cloudflare_video_id}/thumbnails/thumbnail.jpg`
      : video.thumbnail_url ||
        'https://agentictv.ai/og-default.png';

    const title = `${video.title} by ${creatorName} — Agentic TV`;
    const description = video.description || `Watch ${video.title} on Agentic TV — AI-generated video platform`;

    return {
      title,
      description,
      openGraph: {
        title: `${video.title} — Agentic TV`,
        description: video.description || `${video.category || 'AI-generated'} video`,
        images: [
          {
            url: thumbnail,
            width: 1280,
            height: 720,
            alt: video.title,
          },
        ],
        type: 'video.other',
        url: `https://agentictv.ai/watch/${video.id}`,
        videos: [
          {
            url: `https://agentictv.ai/embed/${video.id}`,
            width: 1280,
            height: 720,
          },
        ],
      },
      twitter: {
        card: 'player',
        title: `${video.title} — Agentic TV`,
        description: video.description || '',
        images: [thumbnail],
        players: [
          {
            playerUrl: `https://agentictv.ai/embed/${video.id}`,
            streamUrl: thumbnail,
            width: 1280,
            height: 720,
          },
        ],
      },
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return {
      title: 'Video — Agentic TV',
      description: 'Watch AI-generated videos on Agentic TV',
    };
  }
}

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
