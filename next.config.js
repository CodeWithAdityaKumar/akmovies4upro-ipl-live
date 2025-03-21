/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'static.cricbuzz.com', // For team logos
      'img1.hscicdn.com',    // ESPN Cricinfo images
      'resources.pulse.icc-cricket.com', // ICC Cricket images
      'i.imgur.com',         // Imgur hosted images
      'assets.iplt20.com',   // IPL official assets
      'bcciplayerimages.s3.ap-south-1.amazonaws.com' // BCCI player images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Other Next.js configuration options
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
