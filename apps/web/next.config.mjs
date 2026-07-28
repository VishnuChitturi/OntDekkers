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
  // API rewrites
  //
  // These run server-side inside the Next.js container, so destinations must
  // use Docker Compose internal service names (guide-service:8000,
  // expedition-service:8000) — not the host-mapped ports (8002, 8001).
  //
  // Request flow (fresh clone, no .env.local):
  //   Browser  → GET /guides/api/v1/guides (relative, same origin :3000)
  //   Next.js  → rewrites to http://guide-service:8000/api/v1/guides
  //   Response → camelCase-transformed by axios response interceptor
  //
  // Only the /*/api/ prefixes are rewritten so App Router page routes
  // (/guides, /guides/[id], /my-trips, etc.) are handled normally.
  // ---------------------------------------------------------------------------
  async rewrites() {
    return [
      {
        // Guide Service — internal Docker hostname
        source: "/guides/api/:path*",
        destination: "http://guide-service:8000/api/:path*",
      },
      {
        // Expedition Service — internal Docker hostname
        source: "/expeditions/api/:path*",
        destination: "http://expedition-service:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;

