import type { NextConfig } from "next";

// SỬA: Đổi localhost thành 127.0.0.1 để ép dùng IPv4
const BACKEND_API_URL = process.env.LOCAL_BACKEND_API_URL || 'http://127.0.0.1:8080/api';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_API_URL}/:path*`,
      },
    ];
  },
  allowedDevOrigins: [
    'http://192.168.0.100:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;