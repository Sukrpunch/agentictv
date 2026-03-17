'use client';

import { useState } from 'react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function VerifiedBadge({
  isVerified,
  size = 'md',
  tooltip = 'Verified Creator',
}: VerifiedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isVerified) {
    return null;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <svg
        className={`${sizeMap[size]} text-violet-500 fill-current`}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="9.5" fill="currentColor" />
        <path
          d="M8.5 12.5L6 10M8.5 12.5L14 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded whitespace-nowrap border border-zinc-700 z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}
