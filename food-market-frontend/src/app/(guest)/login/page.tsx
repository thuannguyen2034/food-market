// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';
import Link from 'next/link'; // <-- THÊM IMPORT

const API_BASE_URL = '/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const { login, fetchUserProfile} = useAuth(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if(response.status === 500) {
          throw new Error('Máy chủ đang gặp sự cố, vui lòng thử lại sau!');}
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sai email hoặc mật khẩu');
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
        <h2 className={styles.title}>Đăng nhập Food Market</h2>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>Email</label>
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
        
        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>Mật khẩu</label>
          <input
            type="password"
            id="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
        <div className={styles.navigationLink}>
            <Link href="/forgot-password">
                Quên mật khẩu?
            </Link>
        </div>
        {/* --- THÊM LINK ĐĂNG KÝ --- */}
        <div className={styles.navigationLink}>
            <Link href="/register">
                Chưa có tài khoản? Đăng ký ngay
            </Link>
        </div>
        {/* ------------------------ */}
        
      </form>
    </div>
  );
}