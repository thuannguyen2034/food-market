// Tên file: /app/user/layout.tsx
import React from 'react';
import styles from './UserDashboard.module.css';
import UserSidebar from '@/components/UserSidebar/UserSidebar'; 

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.pageBackground}>
        <div className={styles.dashboard}>
          {/* CỘT BÊN TRÁI: SIDEBAR ĐIỀU HƯỚNG */}
          <div className={styles.sidebar}>
            <UserSidebar />
          </div>

          {/* CỘT BÊN PHẢI: NỘI DUNG TRANG CON */}
          <div className={styles.content}>
            {children}
          </div>
        </div>
    </div>
  );
}