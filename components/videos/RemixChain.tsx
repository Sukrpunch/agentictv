'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
  creator_id?: string;
  is_remix?: boolean;
}

interface RemixChainData {
  ancestors: Video[];
  children: Video[];
  siblings: Video[];
}

interface RemixChainProps {
  videoId: string;
  isRemix?: boolean;
}

export function RemixChain({ videoId, isRemix = false }: RemixChainProps) {
  const [chain, setChain] = useState<RemixChainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChain() {
      try {
        const response = await fetch(`/api/videos/${videoId}/remix-chain`);
        if (response.ok) {
          const data = await response.json();
          setChain(data);
        }
      } catch (error) {
        console.error('Error loading remix chain:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChain();
  }, [videoId]);

  if (loading || !chain) return null;

  const showParent = isRemix && chain.ancestors.length > 0;
  const showRemixes = chain.children.length > 0;

  if (!showParent && !showRemixes) return null;

  return (
    <div className="card bg-zinc-800/50 border border-zinc-700 p-4 mt-6">
      <div className="space-y-4">
        {/* Remix Of */}
        {showParent && (
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🔄</span>
              Remix of
            </h3>
            <Link
              href={`/watch/${chain.ancestors[0].id}`}
              className="flex gap-3 p-2 rounded hover:bg-zinc-700/50 transition"
            >
              {chain.ancestors[0].thumbnail_url && (
                <Image
                  src={chain.ancestors[0].thumbnail_url}
                  alt={chain.ancestors[0].title}
                  width={64}
                  height={48}
                  className="rounded"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium truncate">
                  {chain.ancestors[0].title}
                </p>
                <p className="text-xs text-zinc-400">Original</p>
              </div>
            </Link>
          </div>
        )}

        {/* Videos That Remixed This */}
        {showRemixes && (
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🔄</span>
              {chain.children.length} {chain.children.length === 1 ? 'Video' : 'Videos'} remixed this
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chain.children.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.id}`}
                  className="flex gap-3 p-2 rounded hover:bg-zinc-700/50 transition"
                >
                  {video.thumbnail_url && (
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      width={64}
                      height={48}
                      className="rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {video.title}
                    </p>
                    <p className="text-xs text-zinc-400">Remix</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Siblings */}
        {chain.siblings.length > 0 && (
          <div className="pt-2 border-t border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">👥</span>
              Other remixes
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chain.siblings.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.id}`}
                  className="flex gap-3 p-2 rounded hover:bg-zinc-700/50 transition"
                >
                  {video.thumbnail_url && (
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      width={48}
                      height={36}
                      className="rounded text-xs"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {video.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
