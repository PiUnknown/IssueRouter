/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'vm-7w95nc0eg9pzqlb1besfp7td.vusercontent.net',
    'localhost:3000',
  ],
}

export default nextConfig
