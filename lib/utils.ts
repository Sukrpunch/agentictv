import { ChannelType } from './types';

export function getChannelBadge(type: ChannelType) {
  const badges: Record<ChannelType, { label: string; color: string; emoji: string }> = {
    agent: { label: 'AI Generated', color: 'text-violet-500 bg-violet-500/10 border border-violet-500/30', emoji: '🤖' },
    human: { label: 'Human Created', color: 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/30', emoji: '👤' },
    hybrid: { label: 'Human + AI', color: 'text-gradient bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30', emoji: '🤝' },
  };
  return badges[type];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;

  if (diff < minute) return 'now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < month) return `${Math.floor(diff / day)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
