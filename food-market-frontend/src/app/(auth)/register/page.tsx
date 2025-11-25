// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './register.module.css';

const API_BASE_URL = '/api/v1';

export default function RegisterPage() {
  const router = useRouter();
  const { login,fetchUserProfile } = useAuth();

  // --- CẬP NHẬT Ở ĐÂY ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // <-- THÊM STATE CHO PHONE
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // -----------------------

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        // --- CẬP NHẬT Ở ĐÂY ---
        // Gửi đi DTO đầy đủ
        body: JSON.stringify({ fullName, email, phone, password }),
        // -----------------------
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Đăng ký thất bại.');
      }

      const data = await response.json();
      await login(data.token);
      await fetchUserProfile();
      router.push('/');

    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Đăng Ký Tài Khoản</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.inputGroup}>
          <label htmlFor="fullName" className={styles.label}>
            Họ và Tên
          </label>
          <input
            type="text"
            id="fullName"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            type="email"
            id="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {/* --- INPUT MỚI CHO PHONE --- */}
        <div className={styles.inputGroup}>
          <label htmlFor="phone" className={styles.label}>
            Số điện thoại
          </label>
          <input
            type="tel" // Dùng type="tel" cho điện thoại
            id="phone"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={10} // Validation cơ bản phía client
            maxLength={11} // Dựa theo DTO của bạn
          />
        </div>
        {/* --------------------------- */}

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            Mật khẩu
          </label>
          <input
            type="password"
            id="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6} // Validation cơ bản
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Xác nhận Mật khẩu
          </label>
          <input
            type="password"
            id="confirmPassword"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
        </button>

        <div className={styles.navigationLink}>
          <Link href="/login">
            Đã có tài khoản? Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}