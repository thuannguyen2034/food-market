'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import CategoryFormModal from '@/components/Admin/CategoryFormModal';
import styles from '@/styles/admin/ManagerPage.module.css'; // Dùng chung CSS

// Type DTO (Lấy từ CategoryResponseDTO)
type CategoryResponse = {
  id: number;
  name: string;
  imageUrl: string | null;
  parentId: number | null;
};

export default function CategoryManagerPage() {
  const { authedFetch } = useAuth();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);

  // Tạo một map để tra cứu tên cha
  const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));

  // --- Hàm Fetch Dữ liệu ---
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authedFetch('/api/v1/admin/categories/flat');
      if (response.ok) {
        setCategories(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    const initFetch = async () => {
      await fetchCategories();
    };
    initFetch();
  }, [fetchCategories]);

  // --- Hàm Xử lý Xóa ---
  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này? (Sản phẩm thuộc danh mục này sẽ bị ảnh hưởng)')) {
      try {
        const res = await authedFetch(`/api/v1/admin/categories/${id}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          alert('Xóa thành công');
          fetchCategories(); // Tải lại
        } else {
          alert('Lỗi khi xóa danh mục.');
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
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
    fetchCategories(); // Tải lại danh sách sau khi lưu
  };

  return (
    <div className={styles.managerContainer}>
      <div className={styles.header}>
        <h1>Quản lý Danh mục</h1>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          + Thêm Danh mục
        </button>
      </div>

      {loading && <div>Đang tải...</div>}

      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên Danh mục</th>
            <th>Danh mục cha</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {!loading && categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>
                {cat.parentId ? (categoryNameMap.get(cat.parentId) || `ID: ${cat.parentId}`) : 'N/A'}
              </td>
              <td className={styles.actions}>
                <button onClick={() => handleOpenModal(cat)} className={styles.editButton}>
                  Sửa
                </button>
                <button onClick={() => handleDelete(cat.id)} className={styles.deleteButton}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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