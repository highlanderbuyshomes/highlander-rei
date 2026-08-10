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
      // Exact-match rule first: "/admin/dialer/app/:path*" rewrites a bare
      // "/admin/dialer/app" request to ".../admin/dialer/app/" (trailing
      // slash from the literal destination string), which the origin then
      // 308s back to "/admin/dialer/app" — an infinite redirect loop through
      // this proxy. This rule short-circuits that case before the wildcard
      // rule can match it.
      {
        source: "/admin/dialer/app",
        destination: "https://coldcalldogs-io.vercel.app/admin/dialer/app",
      },
      {
        source: "/admin/dialer/app/:path*",
        destination: "https://coldcalldogs-io.vercel.app/admin/dialer/app/:path*",
      },
    ];
  },
};

export default withMicrofrontends(nextConfig);
