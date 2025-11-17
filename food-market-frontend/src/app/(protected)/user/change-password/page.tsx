// app/(protected)/user/change-password/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const { authedFetch } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '', // để kiểm tra phía client
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleShowPassword = (field: 'old' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra client trước
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận không khớp!');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authedFetch('/api/v1/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        // Xử lý các lỗi phổ biến từ backend
        if (res.status === 400) {
            toast.error(error.message || 'Yêu cầu không hợp lệ. Vui lòng thử lại sau.');
        } else {
          toast.error('Đổi mật khẩu thất bại. Vui lòng thử lại.');
        }
        return;
      }

      // Thành công
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại để tiếp tục.', {
        duration: 5000,
      });

      // Reset form
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });

      // Tùy chọn: Đăng xuất tự động sau 3s
      setTimeout(() => {
        router.push('/logout'); // hoặc gọi hàm logout từ AuthContext
      }, 3000);

    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '24px' }}>
        Đổi mật khẩu
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Mật khẩu cũ */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Mật khẩu hiện tại
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword.old ? 'text' : 'password'}
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
              placeholder="Nhập mật khẩu cũ"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('old')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              {showPassword.old ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Mật khẩu mới */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Mật khẩu mới
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword.new ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
              placeholder="Ít nhất 6 ký tự"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('new')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              {showPassword.new ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Nhập lại mật khẩu mới
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('confirm')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              {showPassword.confirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Nút submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: '1rem',
            padding: '14px',
            background: isLoading ? '#ccc' : '#ee4d2d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        <p>Sau khi đổi mật khẩu, bạn sẽ được đăng xuất tự động để bảo mật.</p>
      </div>
    </div>
  );
}