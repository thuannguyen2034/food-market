'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/admin/Products.module.css';
import {
  Package,
  RefreshCw,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- Types ---
type ProductImage = {
  id: number;
  imageUrl: string;
  isThumbnail: boolean;
};

type CategorySummary = {
  id: number;
  name: string;
};

type ProductResponse = {
  id: number;
  name: string;
  category: CategorySummary;
  basePrice: number;
  stockQuantity: number;
  images: ProductImage[];
  isDeleted: boolean;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export default function ProductListPage() {
  const { authedFetch } = useAuth();

  const [dataPage, setDataPage] = useState<PageResponse<ProductResponse> | null>(null);
  const [loading, setLoading] = useState(true);

  // Separate input from search query
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', pageSize.toString());
      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }

      const response = await authedFetch(`/api/v1/admin/products?${params.toString()}`);

      if (response.ok) {
        const data: PageResponse<ProductResponse> = await response.json();
        setDataPage(data);
      } else {
        console.error("Failed to fetch. Status:", response.status);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
    setLoading(false);
  }, [authedFetch, page, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        const response = await authedFetch(`/api/v1/admin/products/${id}`, {
          method: 'DELETE',
        });

        if (response.ok || response.status === 204) {
          alert('✅ Xóa thành công');
          fetchProducts();
        } else {
          alert('❌ Lỗi khi xóa sản phẩm.');
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!dataPage || newPage < dataPage.totalPages)) {
      setPage(newPage);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(0);
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  // Calculate stats
  const totalProducts = dataPage?.totalElements || 0;
  const lowStockProducts = dataPage?.content.filter(p => p.stockQuantity < 10).length || 0;
  const outOfStockProducts = dataPage?.content.filter(p => p.stockQuantity === 0).length || 0;

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr><td colSpan={7} className={styles.centerText}>Đang tải dữ liệu...</td></tr>
      );
    }

    if (!dataPage || dataPage.content.length === 0) {
      return (
        <tr><td colSpan={7} className={styles.centerText}>
          {searchTerm ? 'Không tìm thấy sản phẩm nào.' : 'Chưa có sản phẩm nào.'}
        </td></tr>
      );
    }

    return dataPage.content.map((product) => (
      <tr key={product.id} className={product.isDeleted ? styles.deletedRow : ''}>
        <td>
          <span className={styles.idBadge}>#{product.id}</span>
        </td>
        <td>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].imageUrl}
              alt={product.name}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.noImage}>No Img</div>
          )}
        </td>
        <td>
          <div className={styles.productName}>{product.name}</div>
          {product.isDeleted && <small className={styles.deletedLabel}>(Đã xóa)</small>}
        </td>
        <td>
          <span className={styles.categoryBadge}>{product.category?.name || '---'}</span>
        </td>
        <td className={styles.priceCell}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
        </td>
        <td>
          <span className={
            product.stockQuantity === 0 ? styles.outOfStock :
              product.stockQuantity < 10 ? styles.lowStock :
                styles.inStock
          }>
            {product.stockQuantity}
          </span>
        </td>
        <td className={styles.actions}>
          <Link href={`/admin/products/${product.id}`} className={styles.editButton}>
            <Edit size={16} /> Sửa
          </Link>
          <button
            onClick={() => handleDelete(product.id)}
            className={styles.deleteButton}
          >
            <Trash2 size={16} /> Xóa
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className={styles.productsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1><Package className="inline-icon" size={32} style={{ marginBottom: -6, marginRight: 10 }} /> Quản lý Sản phẩm</h1>
        <div className={styles.headerActions}>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            <RefreshCw size={18} style={{ marginRight: 8 }} /> Làm mới
          </button>
          <Link href="/admin/products/new" className={styles.addButton}>
            <Plus size={18} style={{ marginRight: 8 }} /> Thêm mới
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsContainer}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}><Package size={40} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalProducts}</div>
            <div className={styles.statLabel}>Tổng sản phẩm</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}><AlertTriangle size={40} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{lowStockProducts}</div>
            <div className={styles.statLabel}>Sắp hết hàng</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.danger}`}>
          <div className={styles.statIcon}><XCircle size={40} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{outOfStockProducts}</div>
            <div className={styles.statLabel}>Hết hàng</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <Search size={18} style={{ marginRight: 8 }} /> Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá gốc</th>
                <th>Tồn kho</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && dataPage && dataPage.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={dataPage.first}
            className={styles.pageButton}
          >
            <ChevronLeft size={16} /> Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {dataPage.number + 1} / {dataPage.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={dataPage.last}
            className={styles.pageButton}
          >
            Sau <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}