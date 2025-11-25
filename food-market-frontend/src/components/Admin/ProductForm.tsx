'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import CategoryFormModal from './CategoryFormModal';
import styles from '@/styles/admin/ProductForm.module.css';

// --- Types ---
type ProductImage = {
  id: number;
  imageUrl: string;
  isThumbnail: boolean;
};

export type AdminProductResponse = {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
  unit: string;
  basePrice: number;
  stockQuantity: number;
  category: { id: number; name: string };
  tags: { id: number; name: string }[];
  isDeleted: boolean;
};

type ProductSaveInputs = {
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  categoryId: number | null;
  tags: string[];
};

interface ProductFormProps {
  initialData?: AdminProductResponse;
}

type SelectOption = { value: any; label: string };

export default function ProductForm({ initialData }: ProductFormProps) {
  const { authedFetch } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  // State dropdowns
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [tagOptions, setTagOptions] = useState<SelectOption[]>([]);

  // State modal & UI
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // State quản lý ảnh
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // --- React Hook Form ---
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductSaveInputs>({
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      unit: '',
      categoryId: null,
      tags: [],
    },
  });

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          authedFetch('/api/v1/admin/categories/flat'),
          authedFetch('/api/v1/admin/tags')
        ]);

        if (catRes.ok) {
          const data = await catRes.json();
          setCategoryOptions(data.map((c: any) => ({ value: c.id, label: c.name })));
        }
        if (tagRes.ok) {
          const data = await tagRes.json();
          setTagOptions(data.map((t: any) => ({ value: t.name, label: t.name })));
        }
      } catch (error) {
        console.error('Lỗi tải metadata:', error);
      }
    };
    fetchMeta();
  }, [authedFetch]);

  // --- 2. Load Initial Data ---
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description,
        basePrice: initialData.basePrice,
        unit: initialData.unit,
        categoryId: initialData.category.id,
        tags: initialData.tags.map(t => t.name),
      });
      setExistingImages(initialData.images || []);
    }
  }, [initialData, reset]);

  // --- 3. Dropzone Handler ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));

    if (validFiles.length > 0) {
      setNewImages(prev => [...prev, ...validFiles]);

      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setNewImagePreviews(prev => [...prev, ...newPreviews]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const removeNewImage = (index: number) => {
    const urlToRevoke = newImagePreviews[index];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }

    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  // Cleanup preview URLs khi component unmount
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors if URL already revoked
        }
      });
    };
  }, []); // Empty deps - chỉ chạy khi unmount

  // --- 4. Submit Handler ---
  const onSubmit: SubmitHandler<ProductSaveInputs> = async (data) => {
    setLoading(true);

    const url = isEditMode
      ? `/api/v1/admin/products/${initialData!.id}`
      : '/api/v1/admin/products';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const formData = new FormData();

      const productDTO = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        unit: data.unit,
        categoryId: data.categoryId,
        tags: data.tags,
        deletedImageIds: deletedImageIds
      };

      formData.append('product', new Blob([JSON.stringify(productDTO)], {
        type: 'application/json'
      }));

      if (newImages.length > 0) {
        newImages.forEach((file) => {
          formData.append('images', file);
        });
      }

      const response = await authedFetch(url, {
        method: method,
        body: formData,
      });

      if (response.ok) {
        alert(isEditMode ? '✅ Cập nhật thành công!' : '✅ Tạo mới thành công!');
        router.push('/admin/products');
        router.refresh();
      } else {
        const errText = await response.text();
        console.error(errText);
        alert('❌ Lỗi khi lưu sản phẩm. Kiểm tra console.');
      }
    } catch (error) {
      console.error('Lỗi submit:', error);
      alert('❌ Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySave = (newCategory: any) => {
    const newOption = { value: newCategory.id, label: newCategory.name };
    setCategoryOptions(prev => [...prev, newOption]);
    setValue('categoryId', newCategory.id, { shouldValidate: true });
    setIsCategoryModalOpen(false);
  };

  // Prevent Enter key from submitting form (except in textarea)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className={styles.formGrid}>
        {/* Left Column */}
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Thông tin cơ bản</h3>
            <div className={styles.formGroup}>
              <label htmlFor="name">Tên sản phẩm <span style={{ color: '#dc3545' }}>*</span></label>
              <input
                id="name"
                placeholder="Nhập tên sản phẩm..."
                {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                rows={5}
                placeholder="Mô tả đặc điểm, xuất xứ..."
                {...register('description')}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Hình ảnh sản phẩm</h3>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className={styles.dropzoneIcon} />
              {isDragActive ? (
                <p className={styles.dropzoneText}>Thả ảnh vào đây...</p>
              ) : (
                <>
                  <p className={styles.dropzoneText}>Kéo thả ảnh vào đây, hoặc click để chọn</p>
                  <p className={styles.dropzoneSubtext}>Hỗ trợ: JPG, PNG, WEBP</p>
                </>
              )}
            </div>

            {/* Image Grid */}
            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className={styles.imageGrid}>
                {/* Existing Images */}
                {existingImages.map((img) => (
                  <div key={`old-${img.id}`} className={styles.imageItem}>
                    <img
                      src={img.imageUrl}
                      alt="product"
                      onClick={() => setPreviewImage(img.imageUrl)}
                    />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); removeExistingImage(img.id); }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {/* New Images */}
                {newImages.map((file, index) => (
                  <div key={`new-${index}`} className={styles.imageItem}>
                    <img
                      src={newImagePreviews[index]}
                      alt="preview"
                      onClick={() => setPreviewImage(newImagePreviews[index])}
                    />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); removeNewImage(index); }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.sidebarContent}>
          <div className={styles.card}>
            <h3>Giá & Đơn vị</h3>
            <div className={styles.inlineGroup}>
              <div className={styles.formGroup}>
                <label htmlFor="basePrice">Giá gốc (VNĐ) <span style={{ color: '#dc3545' }}>*</span></label>
                <input
                  id="basePrice"
                  type="number"
                  placeholder="0"
                  {...register('basePrice', { required: 'Giá là bắt buộc', min: 0, valueAsNumber: true })}
                />
                {errors.basePrice && <span className={styles.error}>{errors.basePrice.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="unit">Đơn vị <span style={{ color: '#dc3545' }}>*</span></label>
                <input
                  id="unit"
                  placeholder="kg, bó, hộp..."
                  {...register('unit', { required: 'Đơn vị là bắt buộc' })}
                />
                {errors.unit && <span className={styles.error}>{errors.unit.message}</span>}
              </div>
            </div>

            {isEditMode && initialData && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '0.9rem' }}>
                <strong>Tồn kho:</strong> {initialData.stockQuantity} {initialData.unit}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3>Phân loại</h3>

            <div className={styles.formGroup}>
              <label>Danh mục <span style={{ color: '#dc3545' }}>*</span></label>
              <div className={styles.selectWithButton}>
                <Controller
                  name="categoryId"
                  control={control}
                  rules={{ required: 'Vui lòng chọn danh mục' }}
                  render={({ field }) => (
                    <Select
                      options={categoryOptions}
                      value={categoryOptions.find(c => c.value === field.value)}
                      onChange={(val) => field.onChange(val?.value)}
                      placeholder="Chọn danh mục..."
                      className={styles.reactSelect}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className={styles.quickAddButton}
                >
                  +
                </button>
              </div>
              {errors.categoryId && <span className={styles.error}>{errors.categoryId.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Tags</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <CreatableSelect
                    isMulti
                    options={tagOptions}
                    value={field.value.map(t => ({ value: t, label: t }))}
                    onChange={(vals) => field.onChange(vals.map(v => v.value))}
                    placeholder="Nhập hoặc chọn tag..."
                    className={styles.reactSelect}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className={styles.submitBar}>
          <button type="button" onClick={() => router.back()}>
            Hủy
          </button>
          <button type="submit" disabled={loading} className={styles.saveButton}>
            {loading ? 'Đang xử lý...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm')}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {previewImage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewImage(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setPreviewImage(null)}>
              ×
            </button>
            <img src={previewImage} alt="Preview" className={styles.modalImage} />
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <CategoryFormModal
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleCategorySave}
        />
      )}
    </>
  );
}