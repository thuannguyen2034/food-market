// src/components/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // Thêm usePathname
import {
  Search, ShoppingCart, Menu, ChevronDown,
  Phone, Clock, Bell, Facebook, MessageCircle, MapPin
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { CategoryResponse } from '@/types/product';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotification();
  const router = useRouter();
  const pathname = usePathname(); // Để check active link

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/v1/categories');
        if (response.ok) {
          const data: CategoryResponse[] = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v1/products/search/hints?keyword=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const hints: string[] = await response.json();
          setSearchSuggestions(hints);
        }
      } catch (error) {
        console.error('Failed to fetch search hints:', error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) setIsCategoriesOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(searchQuery);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const getAvatarInitial = () => {
    return user?.avatarUrl ? (
      <img src={user.avatarUrl} alt="Avatar" className={styles.userAvatar} /> // Fix class name usage
    ) : (
      <div>{user?.fullName ? user.fullName[0].toUpperCase() : 'U'}</div>
    );
  };

  return (
    <div className={styles.navbarWrapper}>

      {/* 1. Top Bar: Slogan & Contact */}
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.topBarContent}>
            {/* Slogan Text bên trái */}
            <div className={styles.welcomeText}>
              <MapPin size={14} color="#e72a2a" />
              <span>Hệ thống thực phẩm sạch & Công thức chuẩn vị BonMi</span>
            </div>

            {/* Contact Info bên phải */}
            <div className={styles.contactInfo}>
              <a href="tel:0853539203" className={styles.contactItem}>
                <Phone size={14} /> 0853.539.203
              </a>
              {/* Social Links */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.contactItem}>
                <Facebook size={14} /> Facebook
              </a>
              <a href="https://zalo.me" target="_blank" rel="noreferrer" className={styles.contactItem}>
                <MessageCircle size={14} /> Zalo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.navContent}>

            {/* Logo */}
            <div className={styles.brand}>
              <Link href="/">
                <img src="/logoBonMi.png" alt="BonMi Market" className={styles.logo} />
              </Link>
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection} ref={searchRef}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Hôm nay bạn muốn ăn gì..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                <button className={styles.searchButton} onClick={() => handleSearch(searchQuery)}>
                  <Search size={20} />
                </button>
              </div>

              {/* Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={styles.searchSuggestions}>
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => handleSearch(suggestion)}
                    >
                      <Search size={14} />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User & Cart Actions */}
            <div className={styles.navLinks}>

              {/* Notifications */}
              {user?.role === 'CUSTOMER' && (
                <Link href="/user/notifications" className={styles.cartLink}>
                  <div className={styles.cartIconWrapper}>
                    <Bell size={24} strokeWidth={1.5} />
                    {unreadCount > 0 && (
                      <span className={styles.cartBadge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px' }}>Thông báo</span>
                </Link>
              )}

              {/* Cart */}
              {user?.role === 'CUSTOMER' && (
                <Link href="/cart" className={styles.cartLink}>
                  <div className={styles.cartIconWrapper}>
                    <ShoppingCart size={24} strokeWidth={1.5} />
                    {totalItems > 0 && (
                      <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px' }}>Giỏ hàng</span>
                </Link>
              )}

              {/* Auth / User Dropdown */}
              {isLoading ? (
                <div>...</div>
              ) : user ? (
                <div className={styles.userMenu} ref={dropdownRef}>
                  <button
                    className={styles.userButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className={styles.userAvatar}>{getAvatarInitial()}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: '#888' }}>Xin chào,</span>
                      <span className={styles.userName}>{user.fullName.split(' ').slice(-1).join(' ')}</span>
                    </div>
                  </button>
                  <div className={`${styles.dropdown} ${isDropdownOpen ? styles.open : ''}`}>
                    {user.role === 'ADMIN' ? (
                      <Link href="/admin/dashboard" className={styles.dropdownItem}>Trang quản trị</Link>
                    ) : (
                      <>
                        <Link href="/user/profile" className={styles.dropdownItem}>Hồ sơ cá nhân</Link>
                        <Link href="/user/purchase" className={styles.dropdownItem}>Đơn hàng của tôi</Link>
                      </>
                    )}
                    <button onClick={handleLogout} className={styles.dropdownButton}>Đăng xuất</button>
                  </div>
                </div>
              ) : (
                <div className={styles.authLinks}>
                  <Link href="/login" className={`${styles.authBtn} ${styles.highlight}`}>Đăng nhập</Link>
                  <span className={styles.divider}>|</span>
                  <Link href="/register" className={styles.authBtn}>Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Categories & Nav Bar */}
      <div className={styles.categoriesBar}>
        <div className={styles.container}>
          <div className={styles.catBarFlex}>

            {/* Dropdown Danh mục */}
            <div className={styles.categoriesDropdown} ref={categoriesRef}>
              <button
                className={styles.categoriesButton}
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Menu size={22} />
                  <span>DANH MỤC SẢN PHẨM</span>
                </div>
                <ChevronDown size={16} style={{ transform: isCategoriesOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>

              {isCategoriesOpen && (
                <div className={styles.categoriesMenu}>
                  {categories.map((category) => (
                    <div key={category.id} className={styles.categoryGroup}>
                      <div className={styles.categoryHeader}>{category.name}</div>
                      <div className={styles.subcategoryList}>
                        {category.children.map((subcat) => (
                          <Link
                            key={subcat.id}
                            href={`/${subcat.slug}`}
                            className={styles.subcategoryLink}
                            onClick={() => setIsCategoriesOpen(false)}
                          >
                            {subcat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Menu Links */}
            <div className={styles.mainMenu}>
              <Link
                href="/recipes"
                className={`${styles.menuItem} ${pathname === '/recipes' ? styles.active : ''}`}
              >
                Công thức nấu ăn
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}