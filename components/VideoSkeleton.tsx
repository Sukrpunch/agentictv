export function VideoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-zinc-800 rounded-xl mb-3" />
      <div className="h-4 bg-zinc-800 rounded mb-2 w-3/4" />
      <div className="h-3 bg-zinc-800 rounded w-1/2 mb-3" />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-zinc-800" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
      </div>
      <div className="h-3 bg-zinc-800 rounded w-2/3" />
    </div>
  );
}

export function VideoSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VideoSkeleton key={i} />
      ))}
    </div>
  );
}
