'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';

// Import thư viện react-select
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

// Import CSS (bạn sẽ tạo file này)
import styles from '@/styles/admin/ProductForm.module.css';

// Import component Modal (chúng ta sẽ tạo ở bước 2)
import CategoryFormModal from './CategoryFormModal';

// --- Định nghĩa Types dựa trên DTO ---
// Request DTO (Dữ liệu form gửi đi)
type ProductSaveInputs = {
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  unit: string;
  categoryId: number | null;
  tags: string[]; // Quan trọng: mảng các TÊN tag
};

// Response DTO (Dữ liệu nhận về, dùng cho initialData)
type CategorySummary = { id: number; name: string };
type Tag = { id: number; name: string };

type ProductResponse = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  unit: string;
  basePrice: number;
  category: CategorySummary;
  tags: Tag[];
};

// --- Props cho component ---
interface ProductFormProps {
  initialData?: ProductResponse;
}

// --- Options cho react-select ---
type SelectOption = {
  value: any;
  label: string;
};

export default function ProductForm({ initialData }: ProductFormProps) {
  const { authedFetch } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  // State cho các dropdown
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [tagOptions, setTagOptions] = useState<SelectOption[]>([]);
  
  // State cho modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // --- Khởi tạo React Hook Form ---
  const {
    register,
    handleSubmit,
    control,
    setValue, // Dùng để set giá trị programmatically
    reset, // Dùng để load initialData
    formState: { errors },
  } = useForm<ProductSaveInputs>({
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      basePrice: 0,
      unit: '',
      categoryId: null,
      tags: [],
    },
  });

  // --- Fetch dữ liệu cho Category và Tag ---
  const fetchCategories = async () => {
    try {
      const res = await authedFetch('/api/v1/admin/categories/flat');
      if (res.ok) {
        const data: CategorySummary[] = await res.json();
        const options = data.map(cat => ({ value: cat.id, label: cat.name }));
        setCategoryOptions(options);
      }
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await authedFetch('/api/v1/admin/tags');
      if (res.ok) {
        const data: Tag[] = await res.json();
        // Tag options dùng cho GỢI Ý, value là TÊN tag
        const options = data.map(tag => ({ value: tag.name, label: tag.name }));
        setTagOptions(options);
      }
    } catch (error) {
      console.error('Lỗi tải tags:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [authedFetch]);

  // --- Load initialData vào form khi ở EditMode ---
  useEffect(() => {
    if (initialData) {
      // Chuyển đổi ProductResponseDTO -> ProductSaveInputs
      reset({
        name: initialData.name,
        description: initialData.description,
        imageUrl: initialData.imageUrl,
        basePrice: initialData.basePrice,
        unit: initialData.unit,
        categoryId: initialData.category.id,
        tags: initialData.tags.map(tag => tag.name), // Lấy TÊN tag
      });
    }
  }, [initialData, reset]);

  // --- Xử lý Submit Form ---
  const onSubmit: SubmitHandler<ProductSaveInputs> = async (data) => {
    setLoading(true);
    const url = isEditMode
      ? `/api/v1/admin/products/${initialData!.id}`
      : '/api/v1/admin/products';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await authedFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert(isEditMode ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        router.push('/admin/products');
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || 'Vui lòng thử lại'}`);
      }
    } catch (error) {
      console.error('Lỗi lưu sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // --- Xử lý khi Modal Category được lưu ---
  const handleCategorySave = (newCategory: CategorySummary) => {
    // 1. Thêm category mới vào danh sách options
    const newOption = { value: newCategory.id, label: newCategory.name };
    setCategoryOptions(prev => [...prev, newOption]);
    
    // 2. Tự động chọn category đó trên form
    setValue('categoryId', newCategory.id, { shouldValidate: true });
    
    // 3. Đóng modal
    setIsCategoryModalOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formGrid}>
        {/* Cột trái: Thông tin chính */}
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Thông tin cơ bản</h3>
            <div className={styles.formGroup}>
              <label htmlFor="name">Tên sản phẩm</label>
              <input
                id="name"
                {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Mô tả</label>
              {/* (Sau này bạn có thể thay bằng ReactQuill) */}
              <textarea
                id="description"
                rows={5}
                {...register('description')}
              />
            </div>
          </div>
          
          <div className={styles.card}>
            <h3>Giá & Đơn vị</h3>
            <div className={styles.inlineGroup}>
              <div className={styles.formGroup}>
                <label htmlFor="basePrice">Giá gốc (VNĐ)</label>
                <input
                  id="basePrice"
                  type="number"
                  {...register('basePrice', { 
                    required: 'Giá là bắt buộc', 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Giá không thể âm' }
                  })}
                />
                {errors.basePrice && <span className={styles.error}>{errors.basePrice.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="unit">Đơn vị tính</label>
                <input
                  id="unit"
                  placeholder="Ví dụ: kg, vỉ, bó"
                  {...register('unit', { required: 'Đơn vị là bắt buộc' })}
                />
                {errors.unit && <span className={styles.error}>{errors.unit.message}</span>}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Hình ảnh</h3>
            <div className={styles.formGroup}>
              <label htmlFor="imageUrl">URL Hình ảnh</label>
              <input
                id="imageUrl"
                placeholder="https://..."
                {...register('imageUrl')}
              />
            </div>
          </div>
        </div>

        {/* Cột phải: Tổ chức */}
        <div className={styles.sidebarContent}>
          <div className={styles.card}>
            <h3>Tổ chức</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="category">Danh mục</label>
              <div className={styles.selectWithButton}>
                <Controller
                  name="categoryId"
                  control={control}
                  rules={{ required: 'Vui lòng chọn danh mục' }}
                  render={({ field }) => (
                    <Select
                      className={styles.reactSelect}
                      classNamePrefix="select"
                      options={categoryOptions}
                      // Chuyển đổi ID (field.value) -> {value, label}
                      value={categoryOptions.find(c => c.value === field.value)}
                      // Chuyển đổi {value, label} -> ID (field.onChange)
                      onChange={(option: SelectOption | null) => field.onChange(option?.value)}
                      placeholder="Chọn danh mục"
                    />
                  )}
                />
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className={styles.quickAddButton}
                  title="Thêm nhanh danh mục"
                >
                  +
                </button>
              </div>
              {errors.categoryId && <span className={styles.error}>{errors.categoryId.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Thẻ (Tags)</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <CreatableSelect
                    isMulti
                    className={styles.reactSelect}
                    classNamePrefix="select"
                    options={tagOptions}
                    // Chuyển đổi mảng TÊN (field.value) -> mảng {value, label}
                    value={field.value.map(name => ({ value: name, label: name }))}
                    // Chuyển đổi mảng {value, label} -> mảng TÊN
                    onChange={(options) => field.onChange(options.map(o => o.value))}
                    placeholder="Chọn hoặc gõ để thêm tag mới"
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Nút Submit */}
        <div className={styles.submitBar}>
          <button type="button" onClick={() => router.push('/admin/products')}>Hủy</button>
          <button type="submit" disabled={loading} className={styles.saveButton}>
            {loading ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm')}
          </button>
        </div>
      </form>

      {/* Modal thêm nhanh Category */}
      {isCategoryModalOpen && (
        <CategoryFormModal 
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleCategorySave}
        />
      )}
    </>
  );
}