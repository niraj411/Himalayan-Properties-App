import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep the PDF engine out of the bundler; it ships its own fonts/wasm and is
  // required at runtime from node_modules in the standalone output.
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
