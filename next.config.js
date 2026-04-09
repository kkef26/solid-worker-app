/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'anadomisi-documents.s3.eu-west-1.amazonaws.com',
      },
    ],
  },
}

module.exports = nextConfig
