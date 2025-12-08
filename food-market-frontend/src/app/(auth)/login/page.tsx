// src/app/login/page.tsx
'use client';

import { useState, Suspense } from 'react'; // Thêm Suspense
import { useRouter, useSearchParams } from 'next/navigation'; // Thêm useSearchParams
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './login.module.css';

const API_BASE_URL = '/api/v1';

// Tách Form ra thành component con để dùng được useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook lấy tham số URL
  const { login, fetchUserProfile } = useAuth(); 

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
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Nếu không parse được JSON, tức là lỗi từ Next.js Proxy (VD: 500 Internal Server Error)
        throw new Error(`Lỗi kết nối Server: ${response.status} ${response.statusText}`);
      }
      if (!response.ok) {
        if(response.status === 500) {
           // Log lỗi thực sự ra console trình duyệt để bạn xem
           console.error("Backend Error:", data); 
           throw new Error('Máy chủ đang gặp sự cố, vui lòng thử lại sau!');
        }
        // Ưu tiên hiển thị message từ backend gửi về
        throw new Error(data.message || 'Sai email hoặc mật khẩu');
      }
      
      // 1. Cập nhật Auth Context
      await login(data.token);
      
      // 2. Fetch User Profile (Token đã được lưu, authedFetch sẽ hoạt động)
      await fetchUserProfile();

      // 3. Xử lý Redirect
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        // Decode để đảm bảo URL đúng định dạng
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push('/');
      }

    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Đăng nhập BonMi</h2>
        
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
            placeholder="nhapcuaban@example.com"
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
            placeholder="••••••••"
          />
        </div>
        
        <div className={styles.forgotPassword}>
            <Link href="/forgot-password">Quên mật khẩu?</Link>
        </div>

        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>

        <div className={styles.registerLink}>
            Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
        </div>
    </form>
  );
}

// Component chính export ra ngoài
export default function LoginPage() {
  return (
    <div className={styles.container}>
      {/* Cần Suspense vì LoginForm dùng useSearchParams */}
      <Suspense fallback={<div>Đang tải form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}