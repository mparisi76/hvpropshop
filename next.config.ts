/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Use 'https' if your server has SSL
        hostname: 'admin.hvpropshop.com', // Your Hetzner IP
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;