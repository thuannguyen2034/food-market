'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPageLayout(
    { children }: { children: React.ReactNode }
){
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Nếu vẫn đang load thì không làm gì cả
        if (isLoading) {
            return;
        }

        // Nếu không còn loading và không có user, điều hướng về trang login
        if (!user) {
            console.log('User chưa đăng nhập, điều hướng về /login');
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Nếu đang load hoặc không có user, hiển thị màn hình loading
    if (isLoading||!user) {
        return (  
             <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem',
      backgroundColor: '#f4f4f4',
    }}>
      Đang tải trang...
    </div>);
    }
    // Nếu có user, hiển thị nội dung trang
    return <>{children}</>;
}
