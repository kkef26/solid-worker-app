/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA-ready: service worker handled by public/sw.js (manual registration)
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'anadomisi-documents.s3.eu-west-1.amazonaws.com',
      },
    ],
  },
};

module.exports = nextConfig;
