import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudflarestream.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'videodelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'iframe.videodelivery.net',
      },
    ],
  },
  headers: async () => [
    {
      source: '/embed/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'ALLOWALL',
        },
      ],
    },
  ],
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
