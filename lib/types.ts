export type ChannelType = 'agent' | 'human' | 'hybrid';
export type VideoStatus = 'processing' | 'ready' | 'error';
export type VideoCategory = 'synthwave' | 'documentary' | 'news' | 'comedy' | 'tutorial' | 'nature' | 'other';

export interface Channel {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  channel_type: ChannelType;
  avatar_color: string;
  owner_email: string;
  total_views: number;
  total_likes: number;
  video_count: number;
  created_at: string;
}

export interface Video {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  ai_tool: string | null;
  channel_type: ChannelType;
  cloudflare_stream_id: string | null;
  thumbnail_url: string | null;
  playback_url: string | null;
  duration_seconds: number | null;
  status: VideoStatus;
  view_count: number;
  likes: number;
  is_featured: boolean;
  created_at: string;
  published_at: string | null;
}

export interface VideoWithChannel extends Video {
  channel?: Channel;
}
