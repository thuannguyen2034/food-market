'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Trash2, Tag } from 'lucide-react'; // Thêm icon Tag
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import CategoryFormModal from '../../categories/components/CategoryFormModal';
import styles from '../AdminProduct.module.css';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
const selectCustomStyles = {
  control: (base: any) => ({ ...base, minHeight: '34px', height: '34px', fontSize: '0.85rem' }),
  valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
  input: (base: any) => ({ ...base, margin: 0, padding: 0 }),
  dropdownIndicator: (base: any) => ({ ...base, padding: 4 })
};
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
    <div className={styles.container} style={{ padding: 0, background: 'transparent' }}>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className={styles.formContainer}>

        {/* LEFT COLUMN: Main Info */}
        <div className={styles.formScroll}>
          {/* Card 1: Basic Info */}
          <div className={styles.card}>
            <h3>Thông tin chung</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tên sản phẩm <span style={{ color: 'red' }}>*</span></label>
              <input className={styles.input} {...register('name', { required: 'Bắt buộc' })} placeholder="Nhập tên sản phẩm..." />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Mô tả</label>
              <div className="quillWrapper"> {/* Class global override trong css module */}
                <Controller name="description" control={control} render={({ field }) => (
                  <ReactQuill theme="snow" value={field.value} onChange={field.onChange} modules={quillModules} placeholder="Mô tả..." />
                )} />
              </div>
            </div>
          </div>

          {/* Card 2: Specs (Dense Grid) */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3>Thông số kỹ thuật</h3>
              <button type="button" onClick={addSpecRow} className={styles.btnOutline} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                <Plus size={12} /> Thêm
              </button>
            </div>
            {specs.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#999' }}>Chưa có thông số.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {specs.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 30px', gap: 8 }}>
                    <input className={styles.input} value={item.key} onChange={e => updateSpec(item.id, 'key', e.target.value)} placeholder="Tên (VD: Xuất xứ)" />
                    <input className={styles.input} value={item.value} onChange={e => updateSpec(item.id, 'value', e.target.value)} placeholder="Giá trị (VD: VN)" />
                    <button type="button" onClick={() => removeSpecRow(item.id)} className={styles.actionBtn} style={{ color: '#dc2626' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Images (Horizontal Grid) */}
          <div className={styles.card}>
            <h3>Hình ảnh</h3>
            <div {...getRootProps()} style={{ border: '1px dashed #ccc', padding: 10, textAlign: 'center', borderRadius: 4, cursor: 'pointer', background: '#fafafa' }}>
              <input {...getInputProps()} />
              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}><Upload size={14} style={{ verticalAlign: 'middle' }} /> Kéo thả hoặc click để tải ảnh</p>
            </div>
            <div className={styles.imgGrid}>
              {existingImages.map(img => (
                <div key={`old-${img.id}`} className={styles.imgItem}>
                  <img src={img.imageUrl} onClick={() => setPreviewImage(img.imageUrl)} />
                  <button type="button" className={styles.removeImgBtn} onClick={(e) => { e.stopPropagation(); removeExistingImage(img.id) }}><X size={12} /></button>
                </div>
              ))}
              {newImages.map((file, i) => (
                <div key={`new-${i}`} className={styles.imgItem}>
                  <img src={newImagePreviews[i]} onClick={() => setPreviewImage(newImagePreviews[i])} />
                  <button type="button" className={styles.removeImgBtn} onClick={(e) => { e.stopPropagation(); removeNewImage(i) }}><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Price & Meta */}
        <div className={styles.formScroll}>
          <div className={styles.card}>
            <h3>Giá & Đơn vị</h3>
            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Giá gốc <span style={{ color: 'red' }}>*</span></label>
                <input type="number" className={styles.input} {...register('basePrice', { required: true, valueAsNumber: true })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Đơn vị <span style={{ color: 'red' }}>*</span></label>
                <input className={styles.input} {...register('unit', { required: true })} placeholder="cái, hộp..." />
              </div>
            </div>

            <div style={{ background: '#fff5f5', padding: 8, borderRadius: 4, border: '1px solid #fed7d7', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isOnSale ? 8 : 0 }}>
                <input type="checkbox" id="saleCheck" {...register('isOnSale')} style={{ accentColor: '#e72a2a' }} />
                <label htmlFor="saleCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c53030', cursor: 'pointer' }}>Bật giảm giá</label>
              </div>
              {isOnSale && (
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.label}>Giá khuyến mãi</label>
                  <input type="number" className={styles.input} {...register('salePrice', { valueAsNumber: true })} />
                  <small style={{ fontSize: '0.7rem', color: '#e53e3e' }}>Phải nhỏ hơn giá gốc</small>
                </div>
              )}
            </div>
            {isEditMode && initialData && (
              <div style={{ fontSize: '0.8rem', marginTop: 10, color: '#555' }}>Tồn kho: <strong>{initialData.stockQuantity}</strong> {initialData.unit}</div>
            )}
          </div>

          <div className={styles.card}>
            <h3>Phân loại</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Danh mục <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ flex: 1 }}>
                  <Controller name="categoryId" control={control} rules={{ required: 'Chọn danh mục' }} render={({ field }) => (
                    <Select
                      styles={selectCustomStyles}
                      options={categoryOptions}
                      value={categoryOptions.find(c => c.value === field.value)}
                      onChange={v => field.onChange(v?.value)}
                      placeholder="Chọn..."
                    />
                  )} />
                </div>
                <button type="button" onClick={() => setIsCategoryModalOpen(true)} className={styles.btnOutline} style={{ padding: '0 8px' }}>+</button>
              </div>
              {errors.categoryId && <span className={styles.error}>Cần chọn danh mục</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tags</label>
              <Controller name="tags" control={control} render={({ field }) => (
                <CreatableSelect
                  isMulti
                  styles={selectCustomStyles}
                  options={tagOptions}
                  value={field.value.map(t => ({ value: t, label: t }))}
                  onChange={v => field.onChange(v.map((i: any) => i.value))}
                  placeholder="Gõ tag..."
                />
              )} />
            </div>
          </div>

          {/* Actions Bottom Right */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 10 }}>
            <button type="button" onClick={() => router.back()} className={styles.btnOutline} style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
            <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </div>
      </form>

      {/* Modals & Previews giữ nguyên logic */}
      {isCategoryModalOpen && (
        <CategoryFormModal onClose={() => setIsCategoryModalOpen(false)} onSave={handleCategorySave} />
      )}
    </div>
  );
}