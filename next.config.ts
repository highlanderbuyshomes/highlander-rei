import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  async rewrites() {
    return [
      {
        source: "/coldcalldogs/:path*",
        destination: "https://coldcalldogs-io.vercel.app/coldcalldogs/:path*",
      },
    ];
  },
};

export default nextConfig;
