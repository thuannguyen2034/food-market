// Tên file: /hooks/useUpdateUser.ts
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserResponseDTO } from '@/app/type/User';
import toast from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho DTO cập nhật thông tin
interface UpdateProfileDTO {
  fullName: string;
  phone: string;
}

// Định nghĩa các tham số cho hàm update
interface UpdateUserParams {
  data: UpdateProfileDTO;
  avatarFile: File | null;
}

export const useUpdateUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { authedFetch, setUser } = useAuth();

  /**
   * Hàm chính để cập nhật thông tin và/hoặc avatar
   */
  const updateUser = async ({ data, avatarFile }: UpdateUserParams) => {
    setIsLoading(true);

    let updatedUser: UserResponseDTO | null = null;

    try {
      // --- Bước 1: Cập nhật thông tin (luôn chạy) ---
      // Endpoint giả định, bạn cần thay bằng endpoint backend của mình
      const infoResponse = await authedFetch('/api/v1/users/profile/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!infoResponse.ok) {
        const errData = await infoResponse.json();
        throw new Error(errData.message || 'Cập nhật thông tin thất bại');
      }

      // Lấy user đã cập nhật từ response
      updatedUser = (await infoResponse.json()) as UserResponseDTO;

      // --- Bước 2: Upload avatar nếu có file mới ---
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('file', avatarFile);

        // Endpoint giả định
        const avatarResponse = await authedFetch('/api/v1/users/profile/avatar', {
          method: 'POST',
          body: avatarFormData,
        });

        if (!avatarResponse.ok) {
          throw new Error('Cập nhật avatar thất bại (thông tin đã được lưu)');
        }
        
        // Lấy user_mới_nhất (với avatar url)
        updatedUser = (await avatarResponse.json()) as UserResponseDTO;
      }

      // --- Bước 3: Cập nhật Context (Yêu cầu chính) ---
      if (updatedUser) {
        setUser(updatedUser); // Cập nhật state toàn cục
      }

      toast.success('Cập nhật thông tin thành công!');
      
    } catch (err: any) {
      toast.error(err.message || 'Đã có lỗi xảy ra trong quá trình cập nhật.');
      
      // Nếu bước 1 thành công nhưng bước 2 thất bại,
      // vẫn cập nhật context với data từ bước 1.
      if (updatedUser) {
        setUser(updatedUser);
      }
    } finally {
      setIsLoading(false);
    }
  };



  return { updateUser, isLoading};
};