/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },
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
