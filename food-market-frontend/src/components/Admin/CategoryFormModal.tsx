'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import Select from 'react-select';
import styles from '@/styles/admin/Modal.module.css';

// --- Types ---
// DTO gửi đi
type CategorySaveInputs = {
  name: string;
  imageUrl: string | null;
  parentId: number | null;
};

// DTO nhận về
type CategoryResponse = {
  id: number;
  name: string;
  imageUrl: string | null;
  parentId: number | null;
};

type SelectOption = { value: number; label: string };

// --- Props ---
interface CategoryFormModalProps {
  onClose: () => void;
  onSave: (newCategory: CategoryResponse) => void;
  // `initialData` dùng cho chế độ "Sửa" (sẽ dùng ở trang CategoryManager)
  initialData?: CategoryResponse | null; 
}

export default function CategoryFormModal({ 
  onClose, 
  onSave, 
  initialData 
}: CategoryFormModalProps) {
  
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parentCategoryOptions, setParentCategoryOptions] = useState<SelectOption[]>([]);
  const isEditMode = !!initialData;

  const { register, handleSubmit, control, formState: { errors } } = useForm<CategorySaveInputs>({
    defaultValues: {
      name: initialData?.name || '',
      imageUrl: initialData?.imageUrl || null,
      parentId: initialData?.parentId || null,
    },
  });

  // Fetch danh sách category (flat) để làm dropdown "Cha"
  useEffect(() => {
    const fetchParentCategories = async () => {
      const res = await authedFetch('/api/v1/admin/categories/flat');
      if (res.ok) {
        const data: CategoryResponse[] = await res.json();
        const options = data.map(cat => ({ value: cat.id, label: cat.name }));
        setParentCategoryOptions(options);
      }
    };
    fetchParentCategories();
  }, [authedFetch]);

  // Xử lý submit (Tạo hoặc Cập nhật)
  const onSubmit: SubmitHandler<CategorySaveInputs> = async (data) => {
    setLoading(true);
    const url = isEditMode
      ? `/api/v1/admin/categories/${initialData!.id}`
      : '/api/v1/admin/categories';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await authedFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const savedCategory = await response.json();
        alert(isEditMode ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        onSave(savedCategory); // Trả về data mới cho component cha
      } else {
        alert('Có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Lỗi lưu danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="cat-name">Tên danh mục</label>
            <input
              id="cat-name"
              {...register('name', { required: 'Tên là bắt buộc' })}
            />
            {errors.name && <span className={styles.error}>{errors.name.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cat-parentId">Danh mục cha</label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  isClearable
                  options={parentCategoryOptions}
                  value={parentCategoryOptions.find(c => c.value === field.value)}
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Chọn danh mục cha (hoặc để trống)"
                />
              )}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cat-imageUrl">URL Hình ảnh</label>
            <input
              id="cat-imageUrl"
              {...register('imageUrl')}
            />
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