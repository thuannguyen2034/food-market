'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { X, Edit, Plus } from 'lucide-react';
import styles from '@/styles/admin/Tags.module.css';

// --- Types ---
type TagSaveInputs = {
  name: string;
};

// DTO cơ bản của Tag
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
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const savedTag = await response.json();
        alert(isEditMode ? '✅ Cập nhật thành công!' : '✅ Tạo mới thành công!');
        onSave(savedTag);
      } else {
        const errorData = await response.json();
        alert(`❌ Lỗi: ${errorData.message || 'Vui lòng thử lại'}`);
      }
    } catch (error) {
      console.error('Lỗi lưu tag:', error);
      alert('❌ Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? <><Edit size={18} style={{ marginRight: 8, display: 'inline', marginBottom: -3 }} /> Sửa Tag</> : <><Plus size={18} style={{ marginRight: 8, display: 'inline', marginBottom: -3 }} /> Tạo Tag mới</>}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="tag-name">
                Tên Tag <span className={styles.required}>*</span>
              </label>
              <input
                id="tag-name"
                {...register('name', {
                  required: 'Tên tag là bắt buộc',
                  minLength: { value: 2, message: 'Tên tag phải có ít nhất 2 ký tự' },
                  maxLength: { value: 50, message: 'Tên tag không được quá 50 ký tự' }
                })}
                placeholder="Nhập tên tag..."
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.cancelButton}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}