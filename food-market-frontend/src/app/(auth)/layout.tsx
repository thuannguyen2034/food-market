// src/app/(auth)/layout.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

/**
 * Component Loading
 */
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem',
      backgroundColor: '#f4f4f4',
      color: '#333'
    }}>
      Đang xử lý...
    </div>
  );
}

/**
 * Tách logic Guard ra component con để dùng được useSearchParams
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // <-- Lấy tham số URL

  useEffect(() => {
    if (isLoading) return;

    // Nếu user ĐÃ đăng nhập
    if (user) {
      // 1. Kiểm tra xem có returnUrl không
      const returnUrl = searchParams.get('returnUrl');
      
      console.log('User đã đăng nhập. ReturnURL:', returnUrl);

      if (returnUrl) {
        // 2. Nếu có, redirect về đó
        router.push(decodeURIComponent(returnUrl));
      } else {
        // 3. Nếu không, về trang chủ như cũ
        router.push('/');
      }
    }
  }, [user, isLoading, router, searchParams]);

  // Trong lúc chờ hoặc đang redirect, hiện loading để ẩn form Login/Register
  if (isLoading || user) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Layout chính phải bọc Suspense vì có dùng useSearchParams
 */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}