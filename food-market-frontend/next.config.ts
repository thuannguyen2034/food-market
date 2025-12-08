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
  // Cho phép truy cập từ các địa chỉ IP trong mạng local (192.168.x.x, 10.x.x.x, etc.)
  // Điều này loại bỏ cảnh báo cross-origin khi truy cập từ thiết bị khác trong cùng mạng
  allowedDevOrigins: [
    'http://192.168.0.100:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  // Thêm dòng này để log lỗi Proxy ra terminal máy tính cho dễ debug
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;