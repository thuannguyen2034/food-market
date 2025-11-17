'use client';

import ProductForm from '@/components/Admin/ProductForm';
import styles from '@/styles/admin/ProductFormPage.module.css';

export default function NewProductPage() {
  return (
    <div className={styles.formPageContainer}>
      <h1>Tạo sản phẩm mới</h1>
      {/* Render component form, không truyền `initialData` 
        để nó biết đây là form tạo mới 
      */}
      <ProductForm />
    </div>
  );
}