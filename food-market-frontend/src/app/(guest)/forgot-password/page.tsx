// src/app/(guest)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
// 1. Import useRouter
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/app/(guest)/login/login.module.css';

const API_BASE_URL = '/api/v1';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Khởi tạo router
  const router = useRouter();

  // Đã xóa: successMessage, countdown, và tất cả useEffect

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Backend luôn trả về 200 OK (ngay cả khi email không tồn tại)
      if (response.ok) {
        
        // 3. [MỚI] Điều hướng sang trang "sent"
        // Truyền email qua URL (giống hệt Shopee)
        // Dùng encodeURIComponent để xử lý ký tự đặc biệt
        router.push(`/forgot-password/sent?email=${encodeURIComponent(email)}`);

      } else {
        throw new Error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Quên Mật Khẩu</h2>

        <>
          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Nhập email của bạn để nhận link đặt lại mật khẩu.
          </p>

          {error && <div className={styles.errorMessage}>{error}</div>}

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
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.button} 
            disabled={isLoading} 
          >
            {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </>

        <div className={styles.navigationLink}>
          <Link href="/login">
            Quay lại Đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}