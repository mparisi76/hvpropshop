/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http', // Use 'https' if your server has SSL
        hostname: '5.161.59.228', // Your Hetzner IP
        port: '8055',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;