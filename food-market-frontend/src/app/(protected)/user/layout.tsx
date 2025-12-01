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
          <div className={styles.sidebar}>
            <UserSidebar />
          </div>

          <div className={styles.content}>
            {children}
          </div>
        </div>
    </div>
  );
}