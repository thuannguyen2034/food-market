import type { NextConfig } from "next";
const BACKEND_API_URL = process.env.LOCAL_BACKEND_API_URL || 'http://localhost:8080/api';
const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Bất cứ URL nào bắt đầu bằng /api/
        destination: `${BACKEND_API_URL}/:path*`, // Sẽ được proxy tới đây
      },
    ];
  },
};

export default nextConfig;
