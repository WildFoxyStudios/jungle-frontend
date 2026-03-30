import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local development backend
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      // Fly.io production backend
      {
        protocol: "https",
        hostname: "*.fly.dev",
        pathname: "/**",
      },
      // Tigris storage (Fly.io S3-compatible)
      {
        protocol: "https",
        hostname: "*.fly.storage.tigris.dev",
        pathname: "/**",
      },
      // AWS S3 / CloudFront (file uploads)
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/**",
      },
      // Giphy CDN
      {
        protocol: "https",
        hostname: "media.giphy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media0.giphy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media1.giphy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media2.giphy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media3.giphy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media4.giphy.com",
        pathname: "/**",
      },
      // Tenor CDN
      {
        protocol: "https",
        hostname: "media.tenor.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "c.tenor.com",
        pathname: "/**",
      },
      // Generic HTTPS images (avatars, profile pictures from external sources)
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },

  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Optimise server component rendering
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  // Custom HTTP headers for security
  async headers() {
    return [
      {
        // All pages except wallet — strict COEP/COOP for SharedArrayBuffer
        source: "/((?!wallet).*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      {
        // Wallet page — relaxed headers for Stripe iframes
        source: "/wallet",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },

  // Redirect bare root to /home for authenticated users
  // (the actual redirect logic lives in middleware.ts)
  async redirects() {
    return [];
  },

  // API rewrites – proxy /api/* to the backend during development so the
  // browser never has to deal with CORS in dev mode.
  // In production the backend URL is set via NEXT_PUBLIC_API_URL and the
  // frontend calls it directly (CORS is handled by the Axum CorsLayer).
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
    // Only proxy when running locally (not on Vercel / production)
    if (process.env.NODE_ENV !== "development") return [];

    return [
      {
        source: "/proxy/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
