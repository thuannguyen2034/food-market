'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, Lock, ShoppingBag, Bell, Edit } from 'lucide-react';
import styles from './UserSidebar.module.css';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  {
    groupTitle: 'Tài Khoản Của Tôi',
    links: [
      { href: '/user/profile', label: 'Hồ Sơ', icon: User },
      { href: '/user/address', label: 'Địa Chỉ', icon: MapPin },
      { href: '/user/change-password', label: 'Đổi Mật Khẩu', icon: Lock },
    ],
  },
  {
    groupTitle: 'Hoạt Động',
    links: [
      { href: '/user/purchase', label: 'Đơn Mua', icon: ShoppingBag },
      { href: '/user/notifications', label: 'Thông Báo', icon: Bell },
    ],
  },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const avatarFallback = user?.fullName ? user.fullName[0].toUpperCase() : 'U';

  return (
    <nav className={styles.sidebarNav}>
      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" />
          ) : (
            <span>{avatarFallback}</span>
          )}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.username}>{user?.fullName || 'Tài khoản'}</span>
          <Link href="/user/profile" className={styles.editProfile}>
            <Edit size={14} />
            Sửa Hồ Sơ
          </Link>
        </div>
      </div>

      <div className={styles.divider}></div>

      {navItems.map((group) => (
        <div key={group.groupTitle} className={styles.navGroup}>
          <span className={styles.groupTitle}>{group.groupTitle}</span>
          <ul className={styles.navList}>
            {group.links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`${styles.navLink} ${pathname === link.href || pathname.startsWith(link.href + '/') ? styles.active : ''
                      }`}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}