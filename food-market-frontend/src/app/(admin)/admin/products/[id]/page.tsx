'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductForm from '@/components/Admin/ProductForm';
import styles from '@/styles/admin/ProductFormPage.module.css';
import { ProductResponseDTO } from '@/app/type/Product';

type Product = ProductResponseDTO; // Thay bằng ProductResponseDTO

export default function EditProductPage() {
  const { authedFetch } = useAuth();
  const params = useParams();
  const { id } = params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          // Gọi API public (GET /api/v1/products/{id})
          const response = await authedFetch(`/api/v1/products/${id}`);
          if (response.ok) {
            const data = await response.json();
            setProduct(data);
          } else {
            setError('Không tìm thấy sản phẩm');
          }
        } catch (err) {
          setError('Lỗi khi tải dữ liệu');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, authedFetch]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;
  if (!product) return <div>Không tìm thấy sản phẩm.</div>;

  return (
    <div className={styles.formPageContainer}>
      <h1>Chỉnh sửa sản phẩm: {product.name}</h1>
      {/* Truyền `initialData` vào. 
        Component Form sẽ tự biết đây là form chỉnh sửa.
      */}
      <ProductForm initialData={product} />
    </div>
  );
}