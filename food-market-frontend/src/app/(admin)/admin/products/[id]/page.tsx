'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductForm, { AdminProductResponse } from '@/app/(admin)/admin/products/components/ProductForm';
import styles from '../AdminProduct.module.css';
import { Edit, Loader2, AlertCircle } from 'lucide-react';

export default function EditProductPage() {
  const { authedFetch } = useAuth();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<AdminProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await authedFetch(`/api/v1/admin/products/${id}`);

          if (response.ok) {
            const data = await response.json();
            setProduct(data);
          } else {
            if (response.status === 404) setError('Không tìm thấy sản phẩm');
            else setError('Lỗi tải dữ liệu: ' + response.status);
          }
        } catch (err) {
          console.error(err);
          setError('Lỗi kết nối');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, authedFetch]);

  if (loading) return <div className={styles.loadingState}><Loader2 className="spin" size={24} /> Đang tải dữ liệu...</div>;
  if (error) return <div className={styles.errorState}><AlertCircle size={24} /> {error}</div>;
  if (!product) return <div className={styles.errorState}>Không tìm thấy sản phẩm.</div>;

  return (
    <div className={styles.formPageContainer}>
      <div className={styles.formPageHeader}>
        <h1><Edit className="inline-icon" size={32} style={{ marginBottom: -6, marginRight: 10 }} /> Chỉnh sửa sản phẩm</h1>
        <p className={styles.formPageSubtitle}>{product.name}</p>
      </div>
      <ProductForm initialData={product} />
    </div>
  );
}