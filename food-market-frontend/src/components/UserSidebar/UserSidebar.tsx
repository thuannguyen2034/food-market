// Tên file: /components/UserSidebar/UserSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './UserSidebar.module.css';
import { useAuth } from '@/context/AuthContext'; // Import AuthContext của bạn

// Định nghĩa các mục điều hướng
const navItems = [
  {
    groupTitle: 'Tài Khoản Của Tôi',
    links: [
      { href: '/user/profile', label: 'Hồ Sơ' },
      { href: '/user/address', label: 'Địa Chỉ' },
      { href: '/user/change-password', label: 'Đổi Mật Khẩu' },
    ],
  },
  {
    groupTitle: 'Hoạt Động',
    links: [
      { href: '/user/purchase', label: 'Đơn Mua' },
      { href: '/user/notifications', label: 'Thông Báo' },
    ],
  },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { user } = useAuth(); // Lấy thông tin user từ Context
  return (
    <nav className={styles.sidebarNav}>
      {/* Phần thông tin User trên cùng */}
      <div className={styles.userProfile}>
        {/* Hiển thị avatar */}
        {
            user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className={styles.avatar} />
            ) : (
            <div>
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>)
        }
        </div>
        <div className={styles.userInfo}>
          <span className={styles.username}>{user?.fullName || 'Tài khoản'}</span>
          <Link href="/user/profile" className={styles.editProfile}>
            Sửa Hồ Sơ
          </Link>
        </div>
      <div className={styles.divider}></div>

      {/* Phần danh sách link điều hướng */}
      {navItems.map((group) => (
        <div key={group.groupTitle} className={styles.navGroup}>
          <span className={styles.groupTitle}>{group.groupTitle}</span>
          <ul className={styles.navList}>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${
                    pathname === link.href ? styles.active : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}