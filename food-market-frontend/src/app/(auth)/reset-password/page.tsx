// src/app/(guest)/reset-password/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
// 1. IMPORT useSearchParams
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '@/app/(auth)/login/login.module.css';

const API_BASE_URL = '/api/v1';

// 2. XÓA 'searchParams' khỏi props
export default function ResetPasswordPage() {
  const router = useRouter();
  
  // 3. SỬ DỤNG HOOK
  const searchParams = useSearchParams(); 
  
  // 4. LẤY TOKEN BẰNG .get()
  const token = searchParams.get('token'); 

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Logic còn lại giữ nguyên
  
  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Token không hợp lệ. Vui lòng yêu cầu link mới.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          newPassword: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token không hợp lệ hoặc đã hết hạn.');
      }

      setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');

      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className={styles.container}>
        <div className={styles.loginForm} style={{ textAlign: 'center' }}>
          <h2 className={styles.title}>Thành công!</h2>
          <p style={{ color: 'green' }}>{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Đặt Lại Mật Khẩu</h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            Mật khẩu mới
          </label>
          <input
            type="password"
            id="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token || isLoading} 
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            id="confirmPassword"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token || isLoading}
          />
        </div>

        <button 
          type="submit" 
          className={styles.button} 
          disabled={!token || isLoading}
        >
          {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>

        <div className={styles.navigationLink}>
          <Link href="/login">Quay lại Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
}