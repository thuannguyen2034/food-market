// Tên file: app/(protected)/user/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Profile.module.css';
import { useUpdateUser } from '@/app/hooks/useUpdateUser'; // <-- Import hook mới

interface UpdateProfileDTO {
  fullName: string;
  phone: string;
}

export default function ProfilePage() {
  const { user } = useAuth(); // Chỉ cần lấy user
  
  // Gọi hook mới
  const { updateUser, isLoading } = useUpdateUser();

  // State quản lý form
  const [formData, setFormData] = useState<UpdateProfileDTO>({
    fullName: '',
    phone: '',
  });
  
  // State quản lý avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  // Điền data vào form khi user load
  useEffect(() => {
     const initFrom = () => {
      if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
      if (user.avatarUrl !== undefined) {
      setAvatarPreview(user.avatarUrl || null);
    }}
    return ;}
    initFrom();
  }, [user]);


  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý chọn file avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB
        // Tốt hơn là dùng state `error` từ hook
        // setError('Dung lượng file quá 1MB'); 
        alert('Dung lượng file quá 1MB');
        return;
      }
      setAvatarFile(file);
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // Xử ly
  // Xử lý submit form (GỌN GÀNG HƠN)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Chỉ cần gọi hàm từ hook
    await updateUser({
      data: formData,
      avatarFile: avatarFile,
    });
  };

  // ----- PHẦN JSX GIỮ NGUYÊN -----
  // (Không cần thay đổi gì trong phần return)

  if (!user) {
    return <div>Đang tải...</div>;
  }
  
  const avatarFallback = user.fullName ? user.fullName.charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.profilePage}>
      <h1 className={styles.title}>Hồ Sơ Của Tôi</h1>
      <p className={styles.subtitle}>
        Quản lý thông tin hồ sơ để bảo mật tài khoản
      </p>
      <div className={styles.divider}></div>

      <form onSubmit={handleSubmit} className={styles.formWrapper}>
        
        {/* === CỘT 1: FORM FIELDS === */}
        <div className={styles.formFields}>
          
          <div className={styles.formRow}>
            <label className={styles.label}>Email</label>
            <div className={styles.fieldValue}>{user.email}</div>
          </div>

          <div className={styles.formRow}>
            <label htmlFor="fullName" className={styles.label}>
              Họ và Tên
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className={styles.input}
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formRow}>
            <label htmlFor="phone" className={styles.label}>
              Số điện thoại
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              className={styles.input}
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formRow}>
            <label className={styles.label}>Vai trò</label>
            <div className={styles.fieldValue}>{user.role}</div>
          </div>
          
          <div className={styles.formRow}>
            <label className={styles.label}>Ngày tham gia</label>
            <div className={styles.fieldValue}>
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
          
          {/* Nút Lưu */}
          <div className={styles.formRow}>
            <label className={styles.label}></label>
            <button type="submit" className={styles.saveButton} disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>

        {/* === CỘT 2: AVATAR === */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Xem trước avatar" />
            ) : (
              <span>{avatarFallback}</span>
            )}
          </div>
          
          <input 
            type="file" 
            id="avatarUpload" 
            className={styles.avatarInput} 
            accept="image/jpeg, image/png"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatarUpload" className={styles.avatarButton}>
            Chọn Ảnh
          </label>
          
          <div className={styles.avatarHint}>
            Dung lượng file tối đa 1 MB
            <br />
            Định dạng: .JPEG, .PNG
          </div>
        </div>

      </form>
    </div>
  );
}