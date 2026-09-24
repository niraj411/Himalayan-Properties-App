import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the PDF engine out of the bundler; it ships its own fonts/wasm and is
  // required at runtime from node_modules.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Files added to public/uploads after the last build are not in next start's
  // public-folder index; afterFiles means Next serves known files itself and only
  // unknown /uploads paths reach the streaming route.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [{ source: "/uploads/:path*", destination: "/api/public-files/:path*" }],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        source: "/listings/cmnvxpsuj0000l44xqrjiwscs",
        destination: "/listings",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
