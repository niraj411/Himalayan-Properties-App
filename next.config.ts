import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the PDF engine out of the bundler; it ships its own fonts/wasm and is
  // required at runtime from node_modules.
  serverExternalPackages: ["@react-pdf/renderer"],
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
