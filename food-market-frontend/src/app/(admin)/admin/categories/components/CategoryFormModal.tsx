'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import Select from 'react-select';
import { X, Upload, Save, Image as ImageIcon } from 'lucide-react';
import styles from '../AdminCategory.module.css';     

type CategorySaveInputs = {
  name: string;
  imageFile: FileList | null;
  parentId: number | null;
};

export type CategoryResponse = {
  id: number; name: string; imageUrl: string | null; parentId: number | null; slug: string; children: CategoryResponse[];
};

interface Props {
  onClose: () => void;
  onSave: (newCategory: CategoryResponse) => void;
  initialData?: CategoryResponse | null;
}

export default function CategoryFormModal({ onClose, onSave, initialData }: Props) {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState<{value: number, label: string}[]>([]);
  const [preview, setPreview] = useState<string | null>(initialData?.imageUrl || null);
  const isEdit = !!initialData;

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CategorySaveInputs>({
    defaultValues: { name: initialData?.name || '', parentId: initialData?.parentId || null },
  });

  const imageFile = watch('imageFile');
  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(imageFile[0]);
    }
  }, [imageFile]);

  // Load Parent Options
  useEffect(() => {
    authedFetch('/api/v1/admin/categories/flat').then(res => {
      if (res.ok) return res.json();
      return [];
    }).then((data: CategoryResponse[]) => {
      const filtered = isEdit ? data.filter(c => c.id !== initialData?.id) : data;
      setParentOptions(filtered.map(c => ({ value: c.id, label: c.name })));
    });
  }, [authedFetch, isEdit, initialData]);

  const onSubmit: SubmitHandler<CategorySaveInputs> = async (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.parentId) formData.append('parentId', data.parentId.toString());
    if (data.imageFile?.[0]) formData.append('imageFile', data.imageFile[0]);

    const url = isEdit ? `/api/v1/admin/categories/${initialData!.id}` : '/api/v1/admin/categories';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await authedFetch(url, { method, body: formData });
      if (res.ok) {
        onSave(await res.json());
      } else {
        const err = await res.json();
        alert('Lỗi: ' + (err.message || 'Server error'));
      }
    } catch { alert('Lỗi kết nối'); } 
    finally { setLoading(false); }
  };

  // Custom Select Style compact
  const selectStyles = {
      control: (base: any) => ({ ...base, minHeight: 34, height: 34, fontSize: '0.9rem', borderColor: '#d1d5db' }),
      valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
      dropdownIndicator: (base: any) => ({ ...base, padding: 4 })
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.modalBody}>
            {/* Grid Layout: Left (Inputs) - Right (Image) */}
            <div className={styles.formGrid}>
                {/* Cột trái */}
                <div style={{display:'flex', flexDirection:'column', gap: 12}}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tên danh mục <span style={{color:'red'}}>*</span></label>
                        <input className={styles.input} {...register('name', {required:'Bắt buộc nhập'})} placeholder="VD: Rau củ quả" />
                        {errors.name && <span className={styles.error}>{errors.name.message}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Danh mục cha</label>
                        <Controller name="parentId" control={control} render={({ field }) => (
                            <Select 
                                {...field} 
                                options={parentOptions} 
                                value={parentOptions.find(c => c.value === field.value) || null}
                                onChange={val => field.onChange(val?.value || null)}
                                placeholder="-- Gốc --"
                                isClearable
                                styles={selectStyles}
                            />
                        )}/>
                    </div>
                </div>

                {/* Cột phải: Upload Ảnh compact */}
                <div>
                    <label className={styles.label}>Hình ảnh</label>
                    <label className={styles.uploadBox}>
                        {preview ? <img src={preview} alt="preview" /> : <ImageIcon size={24} color="#ccc" />}
                        <input type="file" accept="image/*" {...register('imageFile')} className={styles.uploadInput} />
                        {!preview && <span className={styles.uploadLabel}>Chọn ảnh</span>}
                    </label>
                </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnOutline} disabled={loading}>Hủy</button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? 'Đang lưu...' : <><Save size={14}/> Lưu</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}