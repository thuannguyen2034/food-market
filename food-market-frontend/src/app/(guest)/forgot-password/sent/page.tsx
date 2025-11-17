// src/app/(guest)/forgot-password/sent/page.tsx

// 1. [QUAN TRỌNG] Thêm 'use client'
'use client';

import Link from 'next/link';
// 2. Import hook
import { useSearchParams } from 'next/navigation';
import styles from '@/app/(guest)/login/login.module.css'; 

// 3. Xóa props 'searchParams' khỏi hàm
export default function ForgotPasswordSentPage() {
  
  // 4. Dùng hook để lấy email
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'email của bạn';

  return (
    <div className={styles.container}>
      <div className={styles.loginForm} style={{ textAlign: 'center' }}>
        <h2 className={styles.title} style={{ color: '#0070f3' }}>
          Kiểm tra hòm thư của bạn
        </h2>
        
        <p style={{ padding: '0 1rem', lineHeight: 1.6 }}>
          Chúng tôi đã gửi một link đặt lại mật khẩu đến:
        </p>
        
        <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: '1.5rem 0' }}>
          {email}
        </p>

        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          (Nếu không thấy, vui lòng kiểm tra thư mục Spam.)
        </p>
        
        <div className={styles.navigationLink} style={{ marginTop: '2rem' }}>
          <Link href="/login">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}