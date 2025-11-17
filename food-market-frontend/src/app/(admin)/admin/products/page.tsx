'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/admin/ProductList.module.css';

// --- Types (Giả định đã được định nghĩa trong /types) ---
// Giả định CategorySummaryDTO
type CategorySummary = {
  id: number;
  name: string;
};

// Giả định ProductResponseDTO (dựa trên DTO bạn cung cấp + stockQuantity)
type ProductResponseDTO = {
  id: number;
  name: string;
  category: CategorySummary;
  finalPrice: number;
  basePrice: number;
  stockQuantity: number; // TẠM THỜI GIẢ ĐỊNH CÓ TRƯỜNG NÀY
  // ... các trường khác
};

// Giả định Page DTO (cấu trúc của Spring Pageable)
type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Trang hiện tại (zero-based)
  size: number;
};
// --- Hết phần định nghĩa Types ---


export default function ProductListPage() {
  const { authedFetch } = useAuth();
  // Sử dụng đúng type Page<ProductResponseDTO>
  const [productPage, setProductPage] = useState<Page<ProductResponseDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await authedFetch(
          `/api/v1/products?page=${page}&size=10&search=${searchTerm}`
        );
        if (response.ok) {
          const data: Page<ProductResponseDTO> = await response.json();
          setProductPage(data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [authedFetch, page, searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        const response = await authedFetch(`/api/v1/admin/products/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Xóa thành công');
          // Tải lại danh sách (hoặc xóa thủ công)
          setProductPage(prev => {
            if (!prev) return null;
            return {
              ...prev,
              content: prev.content.filter((p: ProductResponseDTO) => p.id !== id),
              totalElements: prev.totalElements - 1
            };
          });
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} style={{ textAlign: 'center' }}>Đang tải...</td>
        </tr>
      );
    }
    
    if (!productPage || productPage.content.length === 0) {
      return (
        <tr>
          <td colSpan={6} style={{ textAlign: 'center' }}>Không tìm thấy sản phẩm nào.</td>
        </tr>
      );
    }

    return productPage.content.map((product: ProductResponseDTO) => (
      <tr key={product.id}>
        <td>{product.id}</td>
        <td>{product.name}</td>
        
        {/* SỬA LỖI: Dùng product.category.name */}
        <td>{product.category?.name || 'N/A'}</td> 
        
        {/* SỬA LỖI: Dùng finalPrice hoặc basePrice */}
        <td>{product.finalPrice.toLocaleString('vi-VN')} ₫</td>
        
        {/* LƯU Ý: Đảm bảo DTO có stockQuantity */}
        <td>{product.stockQuantity}</td>
        
        <td className={styles.actions}>
          <Link href={`/admin/products/${product.id}`} className={styles.editButton}>
            Sửa
          </Link>
          <button 
            onClick={() => handleDelete(product.id)} 
            className={styles.deleteButton}
          >
            Xóa
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className={styles.productListContainer}>
      <div className={styles.header}>
        <h1>Quản lý Sản phẩm</h1>
        <Link href="/admin/products/new" className={styles.addButton}>
          + Thêm sản phẩm mới
        </Link>
      </div>

      {/* TODO: Thêm ô tìm kiếm và bộ lọc */}
      
      <table className={styles.productTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th>Kho</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {renderTableBody()}
        </tbody>
      </table>
      
      {/* TODO: Thêm component Phân trang (dựa trên productPage.totalPages) */}
    </div>
  );
}