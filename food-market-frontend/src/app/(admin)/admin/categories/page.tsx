'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, File, RefreshCw, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CategoryFormModal, { CategoryResponse } from './components/CategoryFormModal';
import styles from './AdminCategory.module.css';

export default function CategoryManagerPage() {
  const { authedFetch } = useAuth();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);

  // Map để tra cứu nhanh tên parent
  const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authedFetch('/api/v1/admin/categories/flat');
      if (response.ok) setCategories(await response.json());
    } catch (error) { console.error('Failed to fetch:', error); }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Client-side Filter
  const filteredCategories = categories.filter(cat =>
    !searchInput ||
    cat.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm('Cảnh báo: Xóa danh mục sẽ ảnh hưởng đến sản phẩm con!\nBạn chắc chắn muốn xóa?')) {
      try {
        const res = await authedFetch(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
          fetchCategories();
        } else {
          alert('Lỗi khi xóa.');
        }
      } catch { alert('Lỗi kết nối.'); }
    }
  };

  const handleOpenModal = (category: CategoryResponse | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const stats = {
    total: categories.length,
    root: categories.filter(c => !c.parentId).length,
    sub: categories.filter(c => c.parentId).length
  };

  return (
    <div className={styles.container}>
      {/* 1. Header & Stats Ribbon */}
      <div className={styles.header}>
        <h1><Folder size={20} color="#e72a2a" /> Quản lý Danh mục</h1>
        <div className={styles.statsRibbon}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Folder size={16} /></div>
            <div><div className={styles.statValue}>{stats.total}</div><div className={styles.statLabel}>Tổng</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}><FolderOpen size={16} /></div>
            <div><div className={styles.statValue}>{stats.root}</div><div className={styles.statLabel}>Gốc</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fffbeb', color: '#d97706' }}><File size={16} /></div>
            <div><div className={styles.statValue}>{stats.sub}</div><div className={styles.statLabel}>Con</div></div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Tìm tên, slug..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}></div>
        <button onClick={fetchCategories} className={styles.btnOutline} title="Làm mới"><RefreshCw size={14} /></button>
        <button onClick={() => handleOpenModal()} className={styles.btnPrimary}><Plus size={14} /> Thêm mới</button>
      </div>

      {/* 3. Compact Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.compactTable}>
          <thead>
            <tr>
              <th style={{ width: 50 }}>ID</th>
              <th>Thông tin Danh mục</th>
              <th style={{ width: 200 }}>Danh mục cha</th>
              <th style={{ width: 80, textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>Đang tải...</td></tr> :
              filteredCategories.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr> :
                filteredCategories.map(cat => (
                  <tr key={cat.id}>
                    <td><small style={{ color: '#999' }}>#{cat.id}</small></td>
                    <td>
                      <div className={styles.catInfo}>
                        {cat.imageUrl ? <img src={cat.imageUrl} className={styles.catImg} /> : <div className={styles.catImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#999' }}>N/A</div>}
                        <div>
                          <span className={styles.catName}>{cat.name}</span>
                          <span className={styles.catSlug}>{cat.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {cat.parentId ? (
                        <span className={styles.badgeChild}>
                          Thuộc: {categoryNameMap.get(cat.parentId) || cat.parentId}
                        </span>
                      ) : (
                        <span className={styles.badgeRoot}>-- Danh mục gốc --</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => handleOpenModal(cat)} className={styles.actionBtn} title="Sửa"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(cat.id)} className={`${styles.actionBtn} ${styles.delete}`} title="Xóa"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CategoryFormModal
          initialData={editingCategory}
          onClose={() => setIsModalOpen(false)}
          onSave={() => { setIsModalOpen(false); fetchCategories(); }}
        />
      )}
    </div>
  );
}