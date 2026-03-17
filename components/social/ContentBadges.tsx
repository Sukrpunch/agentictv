'use client';

export function CollabBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
      🤝 Collab
    </span>
  );
}

export function RemixBadge({ originalTitle }: { originalTitle?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
      title={originalTitle ? `Remix of: ${originalTitle}` : undefined}
    >
      🔄 Remix
    </span>
  );
}
