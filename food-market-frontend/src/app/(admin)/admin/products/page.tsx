'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminProduct.module.css';
import {
  Package, RefreshCw, Plus, Search, Edit, Trash2, RotateCcw, AlertCircle, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
type ProductImageDTO = { id: number; imageUrl: string; displayOrder: number; };
type CategorySummaryDTO = { id: number; name: string; slug: string; };
type AdminProductResponse = {
  id: number; name: string; category: CategorySummaryDTO;
  basePrice: number; salePrice: number; finalPrice: number; onSale: boolean; discountPercentage: number;
  stockQuantity: number; soldCount: number; averageRating: number;
  images: ProductImageDTO[]; deleted: boolean; deletedAt: string | null;
};
type PageResponse<T> = { content: T[]; totalPages: number; totalElements: number; number: number; first: boolean; last: boolean; };

export default function ProductListPage() {
  const { authedFetch } = useAuth();
  const [dataPage, setDataPage] = useState<PageResponse<AdminProductResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchHints, setSearchHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '15');
      if (searchInput) params.append('searchTerm', searchInput);
      if (statusFilter) params.append('status', statusFilter);
      if (sortOrder) params.append('sort', sortOrder);
      if (filterLowStock) params.append('lowStock', 'true');

      const response = await authedFetch(`/api/v1/admin/products?${params.toString()}`);
      if (response.ok) setDataPage(await response.json());
    } catch (error) { console.error('Failed to fetch:', error); }
    setLoading(false);
  }, [authedFetch, page, searchInput, statusFilter, sortOrder, filterLowStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    authedFetch('/api/v1/admin/products/count-low-stock')
      .then(res => res.ok ? res.json() : 0)
      .then(setLowStockCount).catch(console.error);
  }, [authedFetch]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchInput.length < 2) { setSearchHints([]); return; }
      try {
        const res = await fetch(`/api/v1/products/search/hints?keyword=${encodeURIComponent(searchInput)}`);
        if (res.ok) { setSearchHints(await res.json()); setShowHints(true); }
      } catch (e) { }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

  const handleDelete = async (id: number) => {
    if (confirm('Xóa sản phẩm này vào thùng rác?')) {
      await authedFetch(`/api/v1/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const handleRestore = async (id: number) => {
    if (confirm('Khôi phục sản phẩm?')) {
      await authedFetch(`/api/v1/admin/products/${id}/restore`, { method: 'PUT' });
      fetchProducts();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1><Package size={20} className={styles.iconRed} /> Quản lý Sản phẩm</h1>
        <div className={styles.statsRibbon}>
          <div className={`${styles.statCard} ${filterLowStock ? styles.active : ''}`} onClick={() => setFilterLowStock(!filterLowStock)}>
            <div className={styles.statIcon}><AlertCircle size={16} /></div>
            <div>
              <div className={styles.statValue}>{lowStockCount}</div>
              <div className={styles.statLabel}>Sắp hết hàng</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><Package size={16} /></div>
            <div>
              <div className={styles.statValue}>{dataPage?.totalElements || 0}</div>
              <div className={styles.statLabel}>Tổng sản phẩm</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper} ref={searchContainerRef}>
          <Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            placeholder="Tìm tên, danh mục..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => searchHints.length > 0 && setShowHints(true)}
          />
          {showHints && (
            <div className={styles.hintsDropdown}>
              {searchHints.map((h, i) => (
                <div key={i} className={styles.hintItem} onClick={() => { setSearchInput(h); setShowHints(false); }}>
                  <Search size={12} /> {h}
                </div>
              ))}
            </div>
          )}
        </div>

        <Filter size={16} color="#6b7280" />
        <select className={styles.filterSelect} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ACTIVE_ONLY">Đang bán</option>
          <option value="DELETED_ONLY">Thùng rác</option>
          <option value="ALL">Tất cả</option>
        </select>
        <select className={styles.filterSelect} value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(0); }}>
          <option value="newest">Mới nhất</option>
          <option value="best_selling">Bán chạy</option>
          <option value="price_asc">Giá tăng</option>
          <option value="price_desc">Giá giảm</option>
        </select>

        <div style={{ flex: 1 }}></div>
        <button onClick={() => fetchProducts()} className={styles.btnOutline}><RefreshCw size={14} /> Làm mới</button>
        <Link href="/admin/products/new" className={styles.btnPrimary}><Plus size={14} /> Thêm mới</Link>
      </div>

      {/* 3. Compact Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.compactTable}>
          <thead>
            <tr>
              <th style={{ width: 50 }}>ID</th>
              <th style={{ width: 50 }}>Img</th>
              <th>Tên sản phẩm / Danh mục</th>
              <th>Giá bán</th>
              <th>Kho / Đã bán</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>Đang tải...</td></tr> :
              (!dataPage || dataPage.content.length === 0) ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr> :
                dataPage.content.map(p => (
                  <tr key={p.id} className={p.deleted ? styles.deletedRow : ''}>
                    <td>#{p.id}</td>
                    <td>
                      {p.images?.[0] ? <img src={p.images[0].imageUrl} className={styles.productImg} /> : <div className={styles.productImg} style={{ background: '#eee' }} />}
                    </td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className={styles.productName} title={p.name}>{p.name}</Link>
                      <div className={styles.subText}>
                        <span style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{p.category?.name}</span>
                        {p.deleted && <span style={{ color: 'red' }}>(Đã xóa)</span>}
                      </div>
                    </td>
                    <td>
                      {p.onSale ? (
                        <div>
                          <span className={styles.priceFinal}>{fmt(p.finalPrice)}</span>
                          <br />
                          <span className={styles.priceOriginal}>{fmt(p.basePrice)}</span>
                          <span style={{ color: 'red', fontSize: '0.75rem' }}>-{p.discountPercentage}%</span>
                        </div>
                      ) : <span style={{ fontWeight: 600 }}>{fmt(p.basePrice)}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className={`${styles.badge} ${p.stockQuantity === 0 ? styles.badgeOut : p.stockQuantity < 10 ? styles.badgeLow : styles.badgeStock}`}>
                          Kho: {p.stockQuantity}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Bán: {p.soldCount}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!p.deleted ? (
                          <>
                            <Link href={`/admin/products/${p.id}`}><button className={styles.actionBtn} title="Sửa"><Edit size={16} /></button></Link>
                            <button onClick={() => handleDelete(p.id)} className={`${styles.actionBtn} ${styles.delete}`} title="Xóa"><Trash2 size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleRestore(p.id)} className={styles.actionBtn} style={{ color: '#059669' }} title="Khôi phục"><RotateCcw size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {dataPage && dataPage.totalPages > 1 && (
        <div className={styles.pagination}>
          <span>Trang {dataPage.number + 1} / {dataPage.totalPages}</span>
          <button className={styles.pageBtn} disabled={dataPage.first} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
          <button className={styles.pageBtn} disabled={dataPage.last} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  );
}