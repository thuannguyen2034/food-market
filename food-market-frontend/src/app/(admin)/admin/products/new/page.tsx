'use client';

import ProductForm from '@/app/(admin)/admin/products/components/ProductForm';
import styles from '../AdminProduct.module.css';
import { Plus } from 'lucide-react';

export default function NewProductPage() {
  return (
    <div className={styles.formPageContainer}>
      <div className={styles.formPageHeader}>
        <h1><Plus className="inline-icon" size={32} style={{ marginBottom: -6, marginRight: 10 }} /> Tạo sản phẩm mới</h1>
        <p className={styles.formPageSubtitle}>Thêm sản phẩm mới vào kho</p>
      </div>
      <ProductForm />
    </div>
  );
}