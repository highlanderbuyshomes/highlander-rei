import type { NextConfig } from "next";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  async rewrites() {
    return [
      // Exact-match rule first: "/coldcalldogs/:path*" rewrites a bare
      // "/coldcalldogs" request to "…/coldcalldogs/" (trailing slash from the
      // literal destination string), which the origin then 308s back to
      // "/coldcalldogs" — an infinite redirect loop through this proxy. This
      // rule short-circuits that case before the wildcard rule can match it.
      {
        source: "/coldcalldogs",
        destination: "https://coldcalldogs-io.vercel.app/coldcalldogs",
      },
      {
        source: "/coldcalldogs/:path*",
        destination: "https://coldcalldogs-io.vercel.app/coldcalldogs/:path*",
      },
    ];
  },
};

export default withMicrofrontends(nextConfig);
