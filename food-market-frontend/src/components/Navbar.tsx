// src/components/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CategoryResponse } from '@/types/product';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // User dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Category states
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  // Fetch categories on mount
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

  // Debounced search suggestions
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

  // Close dropdowns on outside click
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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
      setSearchQuery('');
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
      {/* Top Row: Logo, Search, User Menu */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <Link href="/">Food Market</Link>
        </div>

        {/* Search Bar */}
        <div className={styles.searchSection} ref={searchRef}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
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
          </div>
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

        {/* User Menu */}
        <div className={styles.navLinks}>
          {isLoading ? (
            <div>Đang tải...</div>
          ) : user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.userButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className={styles.userAvatar}>{getAvatarInitial()}</div>
                {user.fullName.split(' ')[0]}
              </button>
              <div className={`${styles.dropdown} ${isDropdownOpen ? styles.open : ''}`}>
                <Link
                  href="/user/profile"
                  className={styles.dropdownItem}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Hồ sơ cá nhân
                </Link>
                <div className={styles.dropdownDivider}></div>
                <button onClick={handleLogout} className={styles.dropdownButton}>
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>Đăng nhập</Link>
              <Link href="/register" className={styles.navLink}>Đăng ký</Link>
            </>
          )}
        </div>
      </nav>

      {/* Bottom Row: Root Categories */}
      <div className={styles.categoriesBar}>
        {categories.map((category) => (
          <div
            key={category.id}
            className={styles.categoryItem}
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <span
              className={styles.categoryLink}
            >
              {category.name}
            </span>
            {category.children.length > 0 && hoveredCategory === category.id && (
              <div className={styles.subcategoryDropdown}>
                {category.children.map((subcat) => (
                  <Link
                    key={subcat.id}
                    href={`/${subcat.slug}`}
                    className={styles.subcategoryLink}
                  >
                    {subcat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}