'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Folder, Tags, Users, Warehouse, ChevronDown, ChevronRight } from 'lucide-react';
import styles from '@/styles/admin/AdminSidebar.module.css';
interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}
// Định nghĩa các link điều hướng
const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
];

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['/admin/products']);

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  return (
    <>
    <div 
         className={`${styles.overlay} ${isOpen ? styles.show : ''}`} 
         onClick={onClose} 
       />
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logo}>Admin</div>
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
                      <Icon size={18} />
                      <span>{link.label}</span>
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
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
    </>
  );
}