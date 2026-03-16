import Link from 'next/link';
import { Video, Channel } from '@/lib/types';
import { formatDate, formatViews, getChannelBadge, getInitials } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  channel?: Channel;
}

export function VideoCard({ video, channel }: VideoCardProps) {
  const badge = getChannelBadge(video.channel_type);

  return (
    <Link href={`/watch/${video.id}`}>
      <div className="group cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
              <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
              </svg>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>

          {/* Duration Badge */}
          {video.duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-lg text-xs font-semibold text-white">
              {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-semibold truncate mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
          {video.title}
        </h3>

        {/* Channel Info */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: channel?.avatar_color || '#7c3aed' }}
          >
            {channel && getInitials(channel.display_name)}
          </div>
          <span className="text-sm text-zinc-400 truncate">{channel?.display_name || 'Unknown'}</span>
        </div>

        {/* Stats */}
        <div className="text-xs text-zinc-500">
          <span>{formatViews(video.view_count)} views • {formatDate(video.created_at)}</span>
        </div>

        {/* Badge */}
        <div className={`mt-2 badge ${badge.color}`}>
          <span>{badge.emoji}</span>
          <span>{badge.label}</span>
        </div>
      </div>
    </Link>
  );
}
