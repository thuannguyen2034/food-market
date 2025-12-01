'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  RotateCcw, // Icon cho Restore
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

// --- Updated Types based on AdminProductResponseDTO ---
type ProductImageDTO = {
  id: number;
  imageUrl: string;
  displayOrder: number;
};

type CategorySummaryDTO = {
  id: number;
  name: string;
  slug: string;
};

// Khớp hoàn toàn với AdminProductResponseDTO.java
type AdminProductResponse = {
  id: number;
  name: string;
  slug: string;
  category: CategorySummaryDTO;
  basePrice: number;
  salePrice: number;
  finalPrice: number;
  onSale: boolean;
  discountPercentage: number;
  stockQuantity: number;
  soldCount: number;
  averageRating: number;
  reviewCount: number;
  images: ProductImageDTO[];
  deleted: boolean;
  deletedAt: string | null;
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

  const [dataPage, setDataPage] = useState<PageResponse<AdminProductResponse> | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Hints State
  const [searchHints, setSearchHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // ACTIVE_ONLY, DELETED_ONLY, ALL
  const [sortOrder, setSortOrder] = useState('newest'); // newest, best_selling, price_asc, price_desc

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [filterLowStock, setFilterLowStock] = useState(false);
  // 1. Fetch Products List
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', pageSize.toString());

      // Map frontend filters to backend params
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (sortOrder) params.append('sort', sortOrder);
      if (filterLowStock) params.append('lowStock', 'true');

      const response = await authedFetch(`/api/v1/admin/products?${params.toString()}`);

      if (response.ok) {
        const data: PageResponse<AdminProductResponse> = await response.json();
        setDataPage(data);
      } else {
        console.error("Failed to fetch. Status:", response.status);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
    setLoading(false);
  }, [authedFetch, page, searchTerm, statusFilter, sortOrder, filterLowStock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authedFetch('/api/v1/admin/products/count-low-stock');
        if (res.ok) {
          const count = await res.json();
          setLowStockCount(count);
        }
      } catch (err) {
        console.error("Lỗi fetch stats:", err);
      }
    };
    fetchStats();
  }, [authedFetch]);
  // 2. Fetch Search Hints (Debounced)
  useEffect(() => {
    const fetchHints = async () => {
      if (!searchInput.trim() || searchInput.length < 2) {
        setSearchHints([]);
        return;
      }
      try {
        // Gọi API Public getSearchHints từ ProductController
        const res = await fetch(`/api/v1/products/search/hints?keyword=${encodeURIComponent(searchInput)}`);
        if (res.ok) {
          const hints = await res.json();
          setSearchHints(hints);
          setShowHints(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(fetchHints, 300); // Debounce 300ms
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside to close hints
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Actions: Delete (Soft) & Restore
  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này? (Có thể khôi phục sau)')) {
      try {
        const response = await authedFetch(`/api/v1/admin/products/${id}`, {
          method: 'DELETE',
        });
        if (response.ok || response.status === 204) {
          fetchProducts();
        } else {
          alert('❌ Lỗi khi xóa sản phẩm.');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleRestore = async (id: number) => {
    if (confirm('Khôi phục sản phẩm này?')) {
      try {
        const response = await authedFetch(`/api/v1/admin/products/${id}/restore`, {
          method: 'PUT',
        });
        if (response.ok || response.status === 204) {
          alert('✅ Khôi phục thành công');
          fetchProducts();
        } else {
          alert('❌ Lỗi khi khôi phục.');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!dataPage || newPage < dataPage.totalPages)) setPage(newPage);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setShowHints(false);
    setPage(0);
  };

  const handleHintClick = (hint: string) => {
    setSearchInput(hint);
    setSearchTerm(hint);
    setShowHints(false);
    setPage(0);
  };

  // Stats calculation
  const totalProducts = dataPage?.totalElements || 0;
  // Note: These stats are only for the current page/filter context due to server-side paging
  // Ideally backend should provide global stats separately.

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const renderTableBody = () => {
    if (loading) return <tr><td colSpan={8} className={styles.centerText}>Đang tải dữ liệu...</td></tr>;
    if (!dataPage || dataPage.content.length === 0) return <tr><td colSpan={8} className={styles.centerText}>Chưa có dữ liệu.</td></tr>;

    return dataPage.content.map((product) => (
      <tr key={product.id} className={product.deleted ? styles.deletedRow : ''}>
        <td><span className={styles.idBadge}>#{product.id}</span></td>
        <td>
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0].imageUrl} alt={product.name} className={styles.productImage} />
          ) : <div className={styles.noImage}>No Img</div>}
        </td>
        <td>
          <div className={styles.productName}>{product.name}</div>
          {/* Hiển thị Rich Data: Sales, Ratings */}
          <div className={styles.soldCount}>Đã bán: {product.soldCount} | ⭐ {product.averageRating?.toFixed(1) || 0}</div>
          {product.deleted && <small className={styles.deletedLabel}>(Đã xóa: {new Date(product.deletedAt!).toLocaleDateString('vi-VN')})</small>}
        </td>
        <td><span className={styles.categoryBadge}>{product.category?.name || '---'}</span></td>

        {/* Cột giá hiển thị thông minh */}
        <td className={styles.priceCell}>
          {product.onSale ? (
            <>
              <span className={styles.priceOriginal}>{formatPrice(product.basePrice)}</span>
              <span className={styles.priceFinal}>{formatPrice(product.finalPrice)}</span>
              <span className={styles.badgeSale}>-{product.discountPercentage}%</span>
            </>
          ) : (
            <span className={styles.priceFinal}>{formatPrice(product.basePrice)}</span>
          )}
        </td>

        <td>
          <span className={
            product.stockQuantity === 0 ? styles.outOfStock :
              product.stockQuantity < 10 ? styles.lowStock : styles.inStock
          }>
            {product.stockQuantity}
          </span>
        </td>

        <td className={styles.actions}>
          {!product.deleted ? (
            <>
              <Link href={`/admin/products/${product.id}`} className={styles.editButton}>
                <Edit size={16} /> Sửa
              </Link>
              <button onClick={() => handleDelete(product.id)} className={styles.deleteButton}>
                <Trash2 size={16} /> Xóa
              </button>
            </>
          ) : (
            <button onClick={() => handleRestore(product.id)} className={styles.restoreButton}>
              <RotateCcw size={16} /> Khôi phục
            </button>
          )}
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
          <button onClick={fetchProducts} className={styles.refreshButton}>
            <RefreshCw size={18} style={{ marginRight: 8 }} /> Làm mới
          </button>
          <Link href="/admin/products/new" className={styles.addButton}>
            <Plus size={18} style={{ marginRight: 8 }} /> Thêm mới
          </Link>
        </div>
      </div>

      {/* Quick Stats (Optional: Can make dynamic if backend supports stats endpoint) */}
      <div className={styles.statsContainer}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}><Package size={40} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalProducts}</div>
            <div className={styles.statLabel}>Sản phẩm</div>
          </div>
        </div>
        {/* ... Other static stats or fetch from separate stats API ... */}
        <div
          className={`${styles.statCard} ${filterLowStock ? styles.activeFilter : ''}`} // Cần thêm class activeFilter vào CSS để highlight khi chọn
          style={{ cursor: 'pointer', border: filterLowStock ? '2px solid #e74c3c' : '1px solid #eee' }}
          onClick={() => { setFilterLowStock(!filterLowStock); setPage(0); }}
        >
          <div className={styles.statIcon} style={{ color: '#e74c3c', background: '#fadbd8' }}>
            <AlertCircle size={40} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue} style={{ color: '#e74c3c' }}>
              {lowStockCount}
            </div>
            <div className={styles.statLabel}>Sản phẩm sắp hết (≤10)</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filtersBar}>
        <Filter size={20} color="#666" />
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="ACTIVE_ONLY">Đang hoạt động</option>
          <option value="DELETED_ONLY">Thùng rác (Đã xóa)</option>
          <option value="ALL">Tất cả trạng thái</option>
        </select>

        <select
          className={styles.filterSelect}
          value={sortOrder}
          onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}
        >
          <option value="newest">Mới nhất</option>
          <option value="best_selling">Bán chạy nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="name_asc">Tên A-Z</option>
        </select>
      </div>

      {/* Search Bar with Hints */}
      <div className={styles.searchBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchWrapper} ref={searchContainerRef}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm (Tên, danh mục)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => { if (searchHints.length > 0) setShowHints(true); }}
              className={styles.searchInput}
            />

            {/* Dropdown Gợi ý */}
            {showHints && searchHints.length > 0 && (
              <ul className={styles.suggestionsList}>
                {searchHints.map((hint, index) => (
                  <li
                    key={index}
                    className={styles.suggestionItem}
                    onClick={() => handleHintClick(hint)}
                  >
                    <Search size={14} style={{ marginRight: 8, display: 'inline' }} color="#999" />
                    {hint}
                  </li>
                ))}
              </ul>
            )}
          </div>

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
                <th>Thông tin sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
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