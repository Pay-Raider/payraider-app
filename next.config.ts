import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
  ],
});

const nextConfig: NextConfig = {
  experimental: {
    // Optimise package imports to avoid pulling in entire icon/chart libraries
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@stellar/stellar-sdk",
    ],
    turbopack: {
      root: '../',
    },
  },
  images: {

    // Modern image formats for better compression
    formats: ['image/webp', 'image/avif'],

    // Responsive image sizes for different devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimized images for 30 days (2592000s)
    // Static assets like anchor logos change infrequently
    minimumCacheTTL: 2592000,

    // Quality options available to consumers
    qualities: [50, 75, 85, 95],

    // Allow external image domains (add your CDN domains here)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.stellar.org',
      },
      // Add more patterns as needed for anchor logos and external images
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.stellar-insights.com',
      // },
    ],
  },
};

export default analyzer(withNextIntl(withPWA(nextConfig)));
