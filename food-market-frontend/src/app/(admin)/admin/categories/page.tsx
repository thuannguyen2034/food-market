'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, File, RefreshCw, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CategoryFormModal, { CategoryResponse } from '@/components/Admin/CategoryFormModal';
import styles from '@/styles/admin/Categories.module.css';

export default function CategoryManagerPage() {
  const { authedFetch } = useAuth();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<CategoryResponse[]>([]);

  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);

  // Map để tra cứu tên danh mục cha nhanh chóng
  const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));

  // --- Hàm Fetch Dữ liệu ---
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authedFetch('/api/v1/admin/categories/flat');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setFilteredCategories(data);
      } else {
        console.error("Failed to fetch. Status:", response.status);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on search
  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchInput, categories]);

  // --- Hàm Xử lý Xóa ---
  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này?\n(Sản phẩm thuộc danh mục này sẽ bị ảnh hưởng)')) {
      try {
        const res = await authedFetch(`/api/v1/admin/categories/${id}`, {
          method: 'DELETE'
        });

        if (res.status === 204 || res.ok) {
          alert('✅ Xóa thành công');
          fetchCategories();
        } else {
          alert('❌ Lỗi khi xóa danh mục.');
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('❌ Lỗi kết nối.');
      }
    }
  };

  // --- Hàm Xử lý Modal ---
  const handleOpenModal = (category: CategoryResponse | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchCategories();
  };

  const handleRefresh = () => {
    fetchCategories();
  };

  // Count parent and child categories
  const parentCategories = categories.filter(c => !c.parentId);
  const childCategories = categories.filter(c => c.parentId);

  return (
    <div className={styles.categoriesContainer}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1><Folder size={24} /> Quản lý Danh mục</h1>
        <div className={styles.headerActions}>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            <RefreshCw size={16} /> Làm mới
          </button>
          <button onClick={() => handleOpenModal()} className={styles.addButton}>
            <Plus size={16} /> Thêm Danh mục
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsContainer}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}><Folder size={24} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{categories.length}</div>
            <div className={styles.statLabel}>Tổng danh mục</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}><FolderOpen size={24} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{parentCategories.length}</div>
            <div className={styles.statLabel}>Danh mục gốc</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}><File size={24} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{childCategories.length}</div>
            <div className={styles.statLabel}>Danh mục con</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.centerText}>Đang tải dữ liệu...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.categoriesTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hình ảnh</th>
                  <th>Tên Danh mục</th>
                  <th>Slug</th>
                  <th>Danh mục cha</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.centerText}>
                      {searchInput ? 'Không tìm thấy danh mục nào.' : 'Chưa có danh mục nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <span className={styles.idBadge}>#{cat.id}</span>
                      </td>
                      <td>
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className={styles.categoryImage}
                          />
                        ) : (
                          <div className={styles.noImage}>No Img</div>
                        )}
                      </td>
                      <td>
                        <span className={styles.categoryName}>{cat.name}</span>
                      </td>
                      <td>
                        <code className={styles.slug}>{cat.slug}</code>
                      </td>
                      <td>
                        {cat.parentId ? (
                          <span className={styles.parentBadge}>
                            {categoryNameMap.get(cat.parentId) || `ID: ${cat.parentId}`}
                          </span>
                        ) : (
                          <span className={styles.rootBadge}>-- Gốc --</span>
                        )}
                      </td>
                      <td className={styles.actions}>
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className={styles.editButton}
                          title="Sửa danh mục"
                        >
                          <Edit size={16} /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className={styles.deleteButton}
                          title="Xóa danh mục"
                        >
                          <Trash2 size={16} /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CategoryFormModal
          initialData={editingCategory}
          onClose={handleCloseModal}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
}