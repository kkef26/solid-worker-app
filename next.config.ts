import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anadomisi-documents.s3.eu-west-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
