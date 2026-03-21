import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getCommunityChannel(slug: string) {
  try {
    const { data } = await supabase
      .from('channels_community')
      .select('slug, name, description, theme, video_count, follower_count, cover_url, owner:owner_id(display_name, avatar_url)')
      .eq('slug', slug)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getCommunityChannel(slug);

  if (!channel) {
    return {
      title: 'Channel Not Found — Agentic TV',
      description: 'This channel could not be found on Agentic TV.',
    };
  }

  const ownerName = Array.isArray(channel.owner)
    ? channel.owner[0]?.display_name
    : (channel.owner as any)?.display_name || 'Unknown';

  const description =
    channel.description ||
    `${channel.name} — community channel by @${ownerName} on Agentic TV. ${channel.video_count ?? 0} videos · ${channel.follower_count ?? 0} followers.`;

  const imageUrl = channel.cover_url || 'https://agentictv.ai/og-default.png';
  const title = `${channel.name} — Agentic TV`;

  return {
    title,
    description,
    openGraph: {
      title: `${channel.name} on Agentic TV`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: channel.name,
        },
      ],
      type: 'website',
      url: `https://agentictv.ai/community-channels/${channel.slug}`,
      siteName: 'Agentic TV',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@AgenticTV',
      title: `${channel.name} — Agentic TV`,
      description,
      images: [imageUrl],
    },
  };
}

export default function CommunityChannelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
