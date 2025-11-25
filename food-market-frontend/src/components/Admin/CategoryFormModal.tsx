'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import Select from 'react-select';
import styles from '@/styles/admin/Categories.module.css';

// --- Types ---
type CategorySaveInputs = {
  name: string;
  imageFile: FileList | null;
  parentId: number | null;
};

export type CategoryResponse = {
  id: number;
  name: string;
  imageUrl: string | null;
  parentId: number | null;
  slug: string;
  children: CategoryResponse[];
};

type SelectOption = { value: number; label: string };

interface CategoryFormModalProps {
  onClose: () => void;
  onSave: (newCategory: CategoryResponse) => void;
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
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const isEditMode = !!initialData;

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<CategorySaveInputs>({
    defaultValues: {
      name: initialData?.name || '',
      parentId: initialData?.parentId || null,
    },
  });

  // Watch image file for preview
  const imageFile = watch('imageFile');
  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [imageFile]);

  // Fetch parent categories
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const res = await authedFetch('/api/v1/admin/categories/flat');
        if (res.ok) {
          const data: CategoryResponse[] = await res.json();
          const filteredData = isEditMode
            ? data.filter(c => c.id !== initialData?.id)
            : data;

          const options = filteredData.map(cat => ({ value: cat.id, label: cat.name }));
          setParentCategoryOptions(options);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục cha", err);
      }
    };
    fetchParentCategories();
  }, [authedFetch, isEditMode, initialData]);

  const onSubmit: SubmitHandler<CategorySaveInputs> = async (data) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('name', data.name);

    if (data.parentId) {
      formData.append('parentId', data.parentId.toString());
    }

    if (data.imageFile && data.imageFile.length > 0) {
      formData.append('imageFile', data.imageFile[0]);
    }

    const url = isEditMode
      ? `/api/v1/admin/categories/${initialData!.id}`
      : '/api/v1/admin/categories';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await authedFetch(url, {
        method: method,
        body: formData,
      });

      if (response.ok) {
        const savedCategory = await response.json();
        alert(isEditMode ? '✅ Cập nhật thành công!' : '✅ Tạo mới thành công!');
        onSave(savedCategory);
      } else {
        const errorData = await response.json();
        console.error("Server Error:", errorData.message);
        alert('❌ Có lỗi xảy ra: ' + errorData.message);
      }
    } catch (error) {
      console.error('Lỗi network hoặc server:', error);
      alert('❌ Không thể kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? '✏️ Sửa danh mục' : '➕ Tạo danh mục mới'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.modalBody}>
            {/* Tên danh mục */}
            <div className={styles.formGroup}>
              <label htmlFor="cat-name">
                Tên danh mục <span className={styles.required}>*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                {...register('name', {
                  required: 'Tên là bắt buộc',
                  minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
                  maxLength: { value: 100, message: 'Tên không được quá 100 ký tự' }
                })}
                placeholder="Nhập tên danh mục..."
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>

            {/* Danh mục cha */}
            <div className={styles.formGroup}>
              <label htmlFor="cat-parentId">Danh mục cha</label>
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    options={parentCategoryOptions}
                    value={parentCategoryOptions.find(c => c.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                    placeholder="Chọn danh mục cha (hoặc để trống nếu là gốc)"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#e2e8f0',
                        borderWidth: '2px',
                        borderRadius: '8px',
                        padding: '0.25rem',
                      }),
                    }}
                  />
                )}
              />
              <small className={styles.helpText}>
                Để trống nếu đây là danh mục gốc
              </small>
            </div>

            {/* Upload Ảnh */}
            <div className={styles.formGroup}>
              <label htmlFor="cat-imageFile">Hình ảnh</label>

              {imagePreview && (
                <div className={styles.imagePreview}>
                  <img src={imagePreview} alt="Preview" />
                  <p className={styles.previewLabel}>
                    {isEditMode && !imageFile ? 'Ảnh hiện tại' : 'Xem trước'}
                  </p>
                </div>
              )}

              <input
                id="cat-imageFile"
                type="file"
                accept="image/*"
                {...register('imageFile')}
                className={styles.fileInput}
              />
              <small className={styles.helpText}>
                Chọn file ảnh để {isEditMode ? 'thay thế' : 'tải lên'}
              </small>
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