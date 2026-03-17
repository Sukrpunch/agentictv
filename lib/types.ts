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
  is_verified?: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  channel_id?: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  ai_tool: string | null;
  channel_type?: ChannelType;
  cloudflare_stream_id?: string | null;
  cloudflare_video_id?: string | null;
  thumbnail_url: string | null;
  playback_url: string | null;
  duration_seconds: number | null;
  status: VideoStatus;
  view_count: number;
  likes?: number;
  like_count?: number;
  is_featured?: boolean;
  created_at: string;
  published_at?: string | null;
  is_collab?: boolean;
  is_remix?: boolean;
  original_video_id?: string | null;
  parent_video_id?: string | null;
  linked_track_url?: string | null;
  comment_count?: number;
  creator_id?: string | null;
  genre?: string | null;
  tags?: string[];
  upload_status?: 'draft' | 'published' | 'unlisted';
}

export interface VideoWithChannel extends Video {
  channel?: Channel;
}

export interface Profile {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string | null;
  body: string;
  timestamp_ms: number | null;
  parent_id: string | null;
  created_at: string;
  user?: Profile;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Collaboration {
  id: string;
  video_id: string;
  creator_id: string | null;
  role: 'creator' | 'collaborator' | 'remixer';
  agnt_share: number;
  created_at: string;
}
