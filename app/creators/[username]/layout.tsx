import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: {
    username: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', params.username)
      .single();

    if (!profile) {
      return {
        title: 'Creator Not Found — Agentic TV',
        description: 'This creator could not be found on Agentic TV.',
      };
    }

    const title = `${profile.display_name} (@${profile.username}) — Agentic TV`;
    const description = `${profile.video_count || 0} videos · ${profile.follower_count || 0} followers on Agentic TV`;

    return {
      title,
      description,
      openGraph: {
        title: `${profile.display_name} on Agentic TV`,
        description: profile.bio || description,
        images: [
          {
            url: profile.avatar_url || 'https://agentictv.ai/og-default.png',
            width: 400,
            height: 400,
            alt: profile.display_name,
          },
        ],
        type: 'profile',
        url: `https://agentictv.ai/creators/${profile.username}`,
      },
      twitter: {
        card: 'summary',
        title: `${profile.display_name} on Agentic TV`,
        description: profile.bio || description,
        images: [profile.avatar_url || 'https://agentictv.ai/og-default.png'],
      },
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return {
      title: 'Creator — Agentic TV',
      description: 'Watch videos from creators on Agentic TV',
    };
  }
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
