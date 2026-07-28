/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Allow images from MinIO (local development) and future CDN origins
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Local development API rewrites
  //
  // Guide Service      -> localhost:8002
  // Expedition Service -> localhost:8001
  //
  // Only API routes are rewritten so Next.js page routes
  // (/guides, /guides/[id], /my-trips, etc.) are handled
  // by the App Router instead of being proxied.
  // ---------------------------------------------------------------------------
  async rewrites() {
    return [
      {
        // Guide Service
        source: "/guides/api/:path*",
        destination: "http://localhost:8002/api/:path*",
      },
      {
        // Expedition Service
        source: "/expeditions/api/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
    ];
  },
};

export default nextConfig;

