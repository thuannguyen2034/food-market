//src/app/(admin)/admin/layout.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import styles from '@/styles/admin/AdminLayout.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return (
      <div className={styles.forbiddenContainer}>
        <h1>Không thấy trang</h1>
        <button onClick={() => router.push('/')}>Về trang chủ</button>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>

      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      <div className={styles.mainContent}>
        <div className={styles.mobileHeader}>
          <button
            className={styles.menuBtn}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className={styles.mobileLogo}>{user.role === 'ADMIN' ? 'BonMi Admin' : 'BonMi Nhân viên'}</span>
          <div style={{ width: 24 }}></div>
        </div>

        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}