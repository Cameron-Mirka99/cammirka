import type { NextConfig } from "next";

const cloudfrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: cloudfrontDomain
      ? [{ protocol: "https", hostname: cloudfrontDomain }]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
