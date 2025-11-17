'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

// --- Components (bạn sẽ tạo các component này) ---
import AdminSidebar from '@/components/Admin/AdminSidebar';
// import AdminHeader from '@/components/Admin/AdminHeader';
// --- CSS ---
import styles from '@/styles/admin/AdminLayout.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Logic bảo vệ route (như bạn đã mô tả)
  if (isLoading) {
    return <div>Loading...</div>; // Hoặc một skeleton loader
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (user.role !== 'ADMIN') {
    // Hiển thị trang cấm (Forbidden)
    return (
      <div className={styles.forbiddenContainer}>
        <h1>Truy cập bị cấm</h1>
        <p>Bạn không có quyền truy cập khu vực này.</p>
        <button onClick={() => router.push('/')}>Về trang chủ</button>
      </div>
    );
  }

  // Nếu là ADMIN, hiển thị layout
  return (
    <div className={styles.adminLayout}>
      {/* 1. Sidebar cố định bên trái */}
      <AdminSidebar />

      {/* 2. Phần nội dung chính */}
      <div className={styles.mainContent}>

        {/* Nội dung của từng trang (Dashboard, Products, Users...) */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}