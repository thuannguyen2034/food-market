'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import styles from '@/styles/admin/Modal.module.css';

// --- Types ---
type TagSaveInputs = {
  name: string;
};

// DTO cơ bản của Tag (dùng cho initialData và onSave)
type TagDTO = {
  id: number;
  name: string;
};

interface TagFormModalProps {
  onClose: () => void;
  onSave: (savedTag: TagDTO) => void;
  initialData?: TagDTO | null;
}

export default function TagFormModal({ 
  onClose, 
  onSave, 
  initialData 
}: TagFormModalProps) {
  
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  const { register, handleSubmit, formState: { errors } } = useForm<TagSaveInputs>({
    defaultValues: {
      name: initialData?.name || '',
    },
  });

  // Xử lý submit (Tạo hoặc Cập nhật)
  const onSubmit: SubmitHandler<TagSaveInputs> = async (data) => {
    setLoading(true);
    const url = isEditMode
      ? `/api/v1/admin/tags/${initialData!.id}`
      : '/api/v1/admin/tags';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await authedFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Gửi đi { "name": "..." }
      });

      if (response.ok) {
        const savedTag = await response.json();
        alert(isEditMode ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        onSave(savedTag); // Trả về data mới cho trang cha
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || 'Vui lòng thử lại'}`);
      }
    } catch (error) {
      console.error('Lỗi lưu tag:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? 'Sửa Tag' : 'Tạo Tag mới'}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="tag-name">Tên Tag</label>
            <input
              id="tag-name"
              {...register('name', { required: 'Tên tag là bắt buộc' })}
            />
            {errors.name && <span className={styles.error}>{errors.name.message}</span>}
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" disabled={loading} className={styles.saveButton}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}