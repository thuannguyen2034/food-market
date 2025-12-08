// src/components/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Menu, ChevronDown, Phone, Clock } from 'lucide-react'; // Thêm icon Phone, Clock
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { CategoryResponse } from '@/types/product';
import styles from './Navbar.module.css';
export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();

  // ... (Giữ nguyên các state và logic search/category cũ của bạn) ...
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

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    if (!isCategoriesOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoriesOpen]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const getAvatarInitial = () => {
    return user?.avatarUrl ? (
      <img src={user.avatarUrl} alt="Avatar" className={styles.avatar} />
    ) : (
      <div>{user?.fullName ? user.fullName[0].toUpperCase() : 'U'}</div>
    );
  };

  return (
    <div className={styles.navbarWrapper}>
      {/* 1. Top Bar: Thông tin liên hệ */}
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.contactInfo}>
            <span className={styles.contactItem}>
              <Phone size={14} /> 0853539203
            </span>
            <span className={styles.contactDivider}>|</span>
            <span className={styles.contactItem}>
              <Clock size={14} /> Hỗ trợ 24/7
            </span>
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
                {/* Dùng file ảnh bạn gửi */}
                <img src="/logoBonMi.png" alt="BonMi Market" className={styles.logo} />
              </Link>
            </div>

            {/* Search Bar với Nút Bấm */}
            <div className={styles.searchSection} ref={searchRef}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                <button
                  className={styles.searchButton}
                  onClick={() => handleSearch(searchQuery)}
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={styles.searchSuggestions}>
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search size={14} />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User & Cart */}
            <div className={styles.navLinks}>
              {user?.role === 'CUSTOMER' && (<Link href="/cart" className={styles.cartLink}>
                <div className={styles.cartIconWrapper}>
                  <ShoppingCart size={24} />
                  {totalItems > 0 && (
                    <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
                  )}
                </div>
              </Link>)}

              {isLoading ? (
                <div className={styles.loadingAuth}>...</div>
              ) : user ? (
                <div className={styles.userMenu} ref={dropdownRef}>
                  <button
                    className={styles.userButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className={styles.userAvatar}>{getAvatarInitial()}</div>
                    <span className={styles.userName}>{user.fullName.split(' ')[0]}</span>
                  </button>
                  <div className={`${styles.dropdown} ${isDropdownOpen ? styles.open : ''}`}>
                    {user.role === 'ADMIN' ? (
                       <Link href="/admin/dashboard" className={styles.dropdownItem}>
                          Trang quản trị
                       </Link>
                    ) : (
                       <Link href="/user/profile" className={styles.dropdownItem}>
                          Hồ sơ cá nhân
                       </Link>
                    )}
                    <button onClick={handleLogout} className={styles.dropdownButton}>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.authLinks}>
                  <Link href="/login" className={styles.authLink}>Đăng nhập</Link>
                  <span className={styles.authDivider}>/</span>
                  <Link href="/register" className={styles.authLink}>Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Categories Bar */}
      <div className={styles.categoriesBar}>
        <div className={styles.container}>
          <div className={styles.categoriesDropdown} ref={categoriesRef}>
            <button
              className={styles.categoriesButton}
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            >
              <Menu size={20} />
              <span>DANH MỤC SẢN PHẨM</span>
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
        </div>
      </div>
    </div>
  );
}