// src/app/(auth)/layout.tsx
'use client'; // Bắt buộc, vì chúng ta dùng hook

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Một component loading đơn giản để hiển thị
 * trong khi chúng ta kiểm tra trạng thái đăng nhập.
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
    }}>
      Đang tải trang...
    </div>
  );
}

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log(isLoading);
    // Nếu quá trình kiểm tra auth CHƯA hoàn tất -> không làm gì
    if (isLoading) {
      return;
    }
    // Nếu KHÔNG loading VÀ user ĐÃ đăng nhập
    if (user) {
      // Điều hướng họ về trang chủ
      console.log('User đã đăng nhập, điều hướng về /');
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Mấu chốt:
  // Nếu chúng ta đang tải (check auth), HOẶC user đã đăng nhập (và đang chờ redirect)
  // thì chúng ta KHÔNG render {children} (tức là form login/register).
  // Thay vào đó, chúng ta hiển thị màn hình loading.
  if (isLoading || user) {
    return <LoadingScreen />;
  }

  // Nếu không loading VÀ không có user -> hiển thị trang (login hoặc register)
  return <>{children}</>;
}