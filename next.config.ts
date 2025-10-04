import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow any HTTPS image host
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      // Allow any HTTP image host (if needed)
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
