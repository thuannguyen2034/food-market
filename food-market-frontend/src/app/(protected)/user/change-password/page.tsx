'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import styles from './ChangePassword.module.css';

export default function ChangePasswordPage() {
  const { authedFetch } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
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
        if (res.status === 400) {
          toast.error(error.message || 'Yêu cầu không hợp lệ. Vui lòng thử lại sau.');
        } else {
          toast.error('Đổi mật khẩu thất bại. Vui lòng thử lại.');
        }
        return;
      }

      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại để tiếp tục.', {
        duration: 5000,
      });

      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => {
        router.push('/logout');
      }, 3000);

    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Shield size={32} className={styles.headerIcon} />
        <h1>Đổi mật khẩu</h1>
        <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>
            <Lock size={16} />
            Mật khẩu hiện tại
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword.old ? 'text' : 'password'}
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu cũ"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('old')}
              className={styles.toggleBtn}
            >
              {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label>
            <Lock size={16} />
            Mật khẩu mới
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword.new ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder="Ít nhất 6 ký tự"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('new')}
              className={styles.toggleBtn}
            >
              {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label>
            <Lock size={16} />
            Nhập lại mật khẩu mới
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('confirm')}
              className={styles.toggleBtn}
            >
              {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.submitBtn}
        >
          {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
        </button>
      </form>

      <div className={styles.notice}>
        <AlertCircle size={16} />
        <p>Sau khi đổi mật khẩu, bạn sẽ được đăng xuất tự động để bảo mật.</p>
      </div>
    </div>
  );
}