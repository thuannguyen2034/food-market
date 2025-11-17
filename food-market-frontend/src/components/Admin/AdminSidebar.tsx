'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/admin/AdminSidebar.module.css';

// Định nghĩa các link điều hướng
const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: '📦' },
  { href: '/admin/products', label: 'Sản phẩm', icon: '🍎' },
  { href: '/admin/categories', label: 'Danh mục', icon: '🏷️' },
  { href: '/admin/tags', label: 'Thẻ (Tags)', icon: '#️⃣' }, // <-- THÊM
  { href: '/admin/users', label: 'Người dùng', icon: '👥' },
  { href: '/admin/inventory', label: 'Kho hàng', icon: '🏭' },
  // Thêm các link khác tại đây...
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        FoodMarket Admin
      </div>
      <nav className={styles.nav}>
        <ul>
          {navLinks.map((link) => {
            // Xác định link active
            const isActive = pathname === link.href || 
                             (link.href !== '/admin' && pathname.startsWith(link.href));;
            
            return (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.icon}>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}