// src/components/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  // Lấy trạng thái từ AuthContext
  const { user, isLoading, logout } = useAuth();
  
  // State để quản lý việc mở/đóng dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Ref để theo dõi element dropdown (cho việc click-outside)
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Logic: Bấm ra ngoài để đóng dropdown
  useEffect(() => {
    // Chỉ chạy khi dropdown đang mở
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      // Nếu click ra ngoài vùng của dropdownRef
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    // Thêm event listener
    document.addEventListener('mousedown', handleClickOutside);
    // Dọn dẹp listener khi component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]); // Chạy lại mỗi khi isDropdownOpen thay đổi

  const handleLogout = () => {
    setIsDropdownOpen(false); // Đóng dropdown
    logout(); // Gọi hàm logout từ context
  };

  // Lấy chữ cái đầu của tên để làm avatar
  const getAvatarInitial = () => {
    return user?.avatarUrl ? (
      <img src={user.avatarUrl} alt="Avatar" className={styles.avatar} />
    ) : (
      <div>{user?.fullName ? user.fullName[0].toUpperCase() : 'U'}</div>
    );
  };

  return (
    <nav className={styles.navbar}>
      {/* 1. Logo/Brand (luôn hiển thị) */}
      <div className={styles.brand}>
        <Link href="/">Food Market</Link>
      </div>

      {/* 2. Các link điều hướng (thay đổi theo trạng thái) */}
      <div className={styles.navLinks}>
        {isLoading ? (
          <div>Đang tải...</div>
        ) : user ? (
          // --- ĐÃ ĐĂNG NHẬP ---
          <div className={styles.userMenu} ref={dropdownRef}>
            <button
              className={styles.userButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                
              <div className={styles.userAvatar}>{getAvatarInitial()}</div>
              {/* Chỉ lấy tên (First Name) */}
              {user.fullName.split(' ')[0]}
            </button>

            {/* Dropdown Menu */}
            <div
              className={`${styles.dropdown} ${
                isDropdownOpen ? styles.open : ''
              }`}
            >
              <Link
                href="/user/profile"
                className={styles.dropdownItem}
                onClick={() => setIsDropdownOpen(false)} // Đóng khi click
              >
                Hồ sơ cá nhân
              </Link>
              <div className={styles.dropdownDivider}></div>
              <button
                onClick={handleLogout}
                className={styles.dropdownButton}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          // --- CHƯA ĐĂNG NHẬP ---
          <>
            <Link href="/login" className={styles.navLink}>
              Đăng nhập
            </Link>
            <Link href="/register" className={styles.navLink}>
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}