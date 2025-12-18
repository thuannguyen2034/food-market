'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Folder, Tags, Users,
  Warehouse, ChefHat, ChevronDown, ChevronRight, MessageCircle,
  LogOut, Settings,Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import styles from '@/styles/admin/AdminSidebar.module.css';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
}

export default function AdminSidebar({ isOpen = false, onClose, user }: AdminSidebarProps) {
  const { logout } = useAuth(); // Lấy hàm logout từ context
  const router = useRouter();
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['/admin/products']);

  // Xử lý đăng xuất
  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      router.push('/login');
    }
  };

  // Logic phân quyền Menu (Giữ nguyên)
  let navLinks;
  if (user?.role === 'ADMIN') {
    navLinks = [
      { href: '/admin/dashboard', label: 'Thống kê', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
      {
        href: '/admin/products',
        label: 'Sản phẩm',
        icon: Package,
        subItems: [
          { href: '/admin/categories', label: 'Danh mục', icon: Folder },
          { href: '/admin/tags', label: 'Thẻ (Tags)', icon: Tags },
          { href: '/admin/products', label: 'Sản phẩm', icon: Package },
          { href: '/admin/inventory', label: 'Kho hàng', icon: Warehouse },
        ]
      },
      { href: '/admin/users', label: 'Người dùng', icon: Users },
      { href: '/admin/chats', label: 'Hội thoại', icon: MessageCircle },
      { href: '/admin/recipes', label: 'Công thức', icon: ChefHat },
    ];
  } else {
    navLinks = [
      { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
      { href: '/admin/inventory', label: 'Kho hàng', icon: Warehouse },
      { href: '/admin/chats', label: 'Hội thoại', icon: MessageCircle },
      { href: '/admin/recipes', label: 'Công thức', icon: ChefHat },
    ];
  }

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus(prev =>
      prev.includes(href) ? prev.filter(item => item !== href) : [...prev, href]
    );
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.show : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* 1. Header Logo */}
        <div className={styles.logo}>
          {user?.role === 'ADMIN' ? 'BonMi Admin' : 'BonMi Staff'}
        </div>

        {/* 2. Main Navigation (Cuộn được) */}
        <nav className={styles.nav}>
          <ul>
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const hasSubItems = link.subItems && link.subItems.length > 0;
              const isSubMenuOpen = hasSubItems && openSubMenus.includes(link.href);
              const Icon = link.icon;

              return (
                <li key={link.href}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleSubMenu(link.href)}
                        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Icon size={18} />
                          <span>{link.label}</span>
                        </div>
                        {isSubMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {isSubMenuOpen && (
                        <ul className={styles.subMenu}>
                          {link.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={`${styles.subNavLink} ${isSubActive ? styles.active : ''}`}
                                >
                                  <SubIcon size={16} />
                                  <span>{subItem.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={18} />
                        <span>{link.label}</span>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 3. User Footer (Mới thêm) */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.fullName || 'Admin'}</span>
              <span className={styles.userRole}>{user?.role || 'Staff'}</span>
            </div>
          </div>
          <div className={styles.footerActions}>
            <Link href="/" className={styles.actionBtn} title="Về trang chủ">
              <Globe size={18} />
            </Link>
            <button onClick={handleLogout} className={styles.actionBtn} title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}