import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSR and performance optimizations
  experimental: {
    // Enable Partial Pre-rendering when stable
    // ppr: true,

    // Optimize server components
    serverComponentsExternalPackages: ["@trpc/server"],

    // Optimize bundling
    optimizePackageImports: ["@tanstack/react-query", "@trpc/client"],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization
  images: {
    domains: [
      "localhost",
      // Add your production domains here
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers
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
          // Performance headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/login",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/auth/login",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },

  // Rewrites for API routing
  async rewrites() {
    return [
      {
        source: "/api/stats",
        destination: "/api/public/stats",
      },
    ];
  },

  // Bundle analysis
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (dev && !isServer) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

      if (process.env.ANALYZE === "true") {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "server",
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }

    // Optimize React Query for SSR
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("@tanstack/react-query");
    }

    return config;
  },

  // Type checking
  typescript: {
    // Type check during build
    ignoreBuildErrors: false,
  },

  // ESLint during build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output configuration
  output: "standalone", // For Docker deployments

  // Compression
  compress: true,

  // Power-pack optimizations
  poweredByHeader: false, // Remove X-Powered-By header

  // Trailing slash handling
  trailingSlash: false,

  // Page extensions
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

export default nextConfig;
