'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Trash2, Tag } from 'lucide-react'; // Thêm icon Tag
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import CategoryFormModal from './CategoryFormModal';
import styles from '@/styles/admin/ProductForm.module.css';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import để tắt SSR cho editor
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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
  specifications: Record<string, string>;
  images: ProductImage[];
  unit: string;
  basePrice: number;
  // --- Fields mới từ DTO ---
  salePrice?: number;
  onSale?: boolean;
  // -------------------------
  stockQuantity: number;
  category: { id: number; name: string };
  tags: { id: number; name: string }[];
  isDeleted: boolean;
};

type ProductSaveInputs = {
  name: string;
  description: string;
  basePrice: number;
  // --- Fields mới ---
  salePrice: number;
  isOnSale: boolean;
  // -----------------
  unit: string;
  categoryId: number | null;
  tags: string[];
};

interface ProductFormProps {
  initialData?: AdminProductResponse;
}

type SelectOption = { value: any; label: string };

type SpecItem = {
  id: number;
  key: string;
  value: string;
};

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

  // State specifications
  const [specs, setSpecs] = useState<SpecItem[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch, // Dùng watch để theo dõi giá trị realtime
    formState: { errors },
  } = useForm<ProductSaveInputs>({
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      salePrice: 0,
      isOnSale: false,
      unit: '',
      categoryId: null,
      tags: [],
    },
  });

  // Theo dõi giá trị để xử lý logic UI
  const isOnSale = watch('isOnSale');
  const basePrice = watch('basePrice');

  // --- 1. Fetch Meta Data ---
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
        description: initialData.description || '',
        basePrice: initialData.basePrice,
        // Map data khuyến mãi
        salePrice: initialData.salePrice || 0,
        isOnSale: initialData.onSale || false,
        
        unit: initialData.unit,
        categoryId: initialData.category.id,
        tags: initialData.tags.map(t => t.name),
      });
      setExistingImages(initialData.images || []);

      if (initialData.specifications) {
        const specList = Object.entries(initialData.specifications).map(([key, value], index) => ({
          id: Date.now() + index,
          key,
          value
        }));
        setSpecs(specList);
      }
    } else {
      setSpecs([{ id: Date.now(), key: '', value: '' }]);
    }
  }, [initialData, reset]);

  // Handlers cho Specifications
  const addSpecRow = () => {
    setSpecs(prev => [...prev, { id: Date.now(), key: '', value: '' }]);
  };
  const removeSpecRow = (idToRemove: number) => {
    setSpecs(prev => prev.filter(item => item.id !== idToRemove));
  };
  const updateSpec = (id: number, field: 'key' | 'value', newValue: string) => {
    setSpecs(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: newValue } : item
    ));
  };

  // Handlers cho Images
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
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true
  });

  const removeNewImage = (index: number) => {
    const urlToRevoke = newImagePreviews[index];
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => { try { URL.revokeObjectURL(url); } catch (e) { } });
    };
  }, []);

  // --- 5. Submit Handler ---
  const onSubmit: SubmitHandler<ProductSaveInputs> = async (data) => {
    setLoading(true);

    const url = isEditMode
      ? `/api/v1/admin/products/${initialData!.id}`
      : '/api/v1/admin/products';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const formData = new FormData();

      const specsObject = specs.reduce((acc, item) => {
        if (item.key.trim()) {
          acc[item.key.trim()] = item.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const productDTO = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        // Gửi thông tin khuyến mãi
        salePrice: data.isOnSale ? data.salePrice : null, // Nếu tắt thì gửi null hoặc 0
        isOnSale: data.isOnSale,
        
        unit: data.unit,
        categoryId: data.categoryId,
        tags: data.tags,
        specifications: specsObject,
        deletedImageIds: deletedImageIds
      };

      formData.append('product', new Blob([JSON.stringify(productDTO)], {
        type: 'application/json'
      }));

      if (newImages.length > 0) {
        newImages.forEach((file) => formData.append('images', file));
      }

      const response = await authedFetch(url, { method, body: formData });

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  }), []);

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
                className={styles.inputLarge}
                placeholder="Nhập tên sản phẩm..."
                {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Mô tả chi tiết</label>
              <div className={styles.richTextContainer}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <ReactQuill
                      theme="snow"
                      value={field.value}
                      onChange={field.onChange}
                      modules={quillModules}
                      className={styles.quillEditor}
                      placeholder="Viết mô tả sản phẩm..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeaderWithAction}>
              <h3>Thông số kỹ thuật</h3>
              <button type="button" onClick={addSpecRow} className={styles.addSpecBtn}>
                <Plus size={16} /> Thêm dòng
              </button>
            </div>
            <div className={styles.specificationsContainer}>
              {specs.length === 0 && (
                <p className={styles.emptyText}>Chưa có thông số nào. Nhấn "Thêm dòng" để tạo.</p>
              )}
              {specs.map((item) => (
                <div key={item.id} className={styles.specRow}>
                  <input
                    placeholder="Tên thuộc tính (VD: Xuất xứ)"
                    value={item.key}
                    onChange={(e) => updateSpec(item.id, 'key', e.target.value)}
                    className={styles.specInputKey}
                  />
                  <input
                    placeholder="Giá trị (VD: Việt Nam)"
                    value={item.value}
                    onChange={(e) => updateSpec(item.id, 'value', e.target.value)}
                    className={styles.specInputValue}
                  />
                  <button type="button" onClick={() => removeSpecRow(item.id)} className={styles.removeSpecBtn}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Hình ảnh sản phẩm</h3>
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
              <input {...getInputProps()} />
              <Upload className={styles.dropzoneIcon} />
              <p className={styles.dropzoneText}>Kéo thả ảnh vào đây, hoặc click để chọn</p>
            </div>
            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className={styles.imageGrid}>
                {existingImages.map((img) => (
                  <div key={`old-${img.id}`} className={styles.imageItem}>
                    <img src={img.imageUrl} alt="product" onClick={() => setPreviewImage(img.imageUrl)} />
                    <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeExistingImage(img.id); }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {newImages.map((file, index) => (
                  <div key={`new-${index}`} className={styles.imageItem}>
                    <img src={newImagePreviews[index]} alt="preview" onClick={() => setPreviewImage(newImagePreviews[index])} />
                    <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeNewImage(index); }}>
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
          {/* --- CẬP NHẬT PHẦN GIÁ --- */}
          <div className={styles.card}>
            <h3>Giá & Đơn vị</h3>
            
            {/* Giá gốc */}
            <div className={styles.formGroup}>
              <label htmlFor="basePrice">Giá gốc (VNĐ) <span style={{ color: '#dc3545' }}>*</span></label>
              <input
                id="basePrice"
                type="number"
                placeholder="0"
                className={styles.inputLarge}
                {...register('basePrice', { required: 'Giá là bắt buộc', min: 0, valueAsNumber: true })}
              />
              {errors.basePrice && <span className={styles.error}>{errors.basePrice.message}</span>}
            </div>

            {/* Checkbox Bật khuyến mãi */}
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="isOnSale"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  {...register('isOnSale')}
                />
                <label htmlFor="isOnSale" style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Tag size={16} color={isOnSale ? "#dc3545" : "#666"} />
                  Bật chương trình giảm giá
                </label>
              </div>
            </div>

            {/* Giá khuyến mãi (Hiện khi isOnSale = true) */}
            {isOnSale && (
              <div className={`${styles.formGroup} ${styles.fadeIn}`}>
                <label htmlFor="salePrice" style={{ color: '#dc3545' }}>Giá khuyến mãi (VNĐ)</label>
                <input
                  id="salePrice"
                  type="number"
                  placeholder="0"
                  className={styles.inputLarge}
                  style={{ borderColor: '#dc3545' }}
                  {...register('salePrice', { 
                    required: isOnSale ? 'Vui lòng nhập giá giảm' : false,
                    min: { value: 0, message: 'Giá không được âm' },
                    valueAsNumber: true,
                    validate: (value) => {
                      if (isOnSale && value >= basePrice) {
                        return 'Giá giảm phải nhỏ hơn giá gốc';
                      }
                      return true;
                    }
                  })}
                />
                {errors.salePrice && <span className={styles.error}>{errors.salePrice.message}</span>}
              </div>
            )}

            <div className={styles.formGroup} style={{ marginTop: '15px' }}>
              <label htmlFor="unit">Đơn vị tính <span style={{ color: '#dc3545' }}>*</span></label>
              <input
                id="unit"
                placeholder="kg, bó, hộp..."
                {...register('unit', { required: 'Đơn vị là bắt buộc' })}
              />
              {errors.unit && <span className={styles.error}>{errors.unit.message}</span>}
            </div>

            {isEditMode && initialData && (
              <div className={styles.stockInfo}>
                <strong>Tồn kho hiện tại:</strong> {initialData.stockQuantity} {initialData.unit}
              </div>
            )}
          </div>
          {/* ------------------------- */}

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
                <button type="button" onClick={() => setIsCategoryModalOpen(true)} className={styles.quickAddButton}>+</button>
              </div>
              {errors.categoryId && <span className={styles.error}>{errors.categoryId.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Tags (Thẻ)</label>
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
          <button type="button" onClick={() => router.back()} className={styles.cancelButton}>Hủy bỏ</button>
          <button type="submit" disabled={loading} className={styles.saveButton}>
            {loading ? 'Đang xử lý...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm')}
          </button>
        </div>
      </form>

      {previewImage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewImage(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setPreviewImage(null)}>×</button>
            <img src={previewImage} alt="Preview" className={styles.modalImage} />
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <CategoryFormModal onClose={() => setIsCategoryModalOpen(false)} onSave={handleCategorySave} />
      )}
    </>
  );
}