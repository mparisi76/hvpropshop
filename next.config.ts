import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.hvpropshop.com",
        pathname: "/assets/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Listing photos are uploaded through a server action. They're resized in
      // the browser first (~0.5–1.5 MB each), but allow room for several.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
