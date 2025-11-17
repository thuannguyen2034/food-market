'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import TagFormModal from '@/components/Admin/TagFormModal';
import styles from '@/styles/admin/ManagerPage.module.css'; // CSS dùng chung

// Type DTO
type TagDTO = {
  id: number;
  name: string;
};

export default function TagManagerPage() {
  const { authedFetch } = useAuth();
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagDTO | null>(null);

  // --- Hàm Fetch Dữ liệu ---
  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authedFetch('/api/v1/admin/tags');
      if (response.ok) {
        const tagList: TagDTO[] = await response.json();
        setTags(tagList);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    const initFetch = async () => {
    await fetchTags();}
    initFetch();
  }, [fetchTags]);

  // --- Hàm Xử lý Xóa ---
  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa tag này?')) {
      try {
        const res = await authedFetch(`/api/v1/admin/tags/${id}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          alert('Xóa thành công');
          fetchTags(); // Tải lại danh sách
        } else {
          alert('Lỗi khi xóa tag.');
        }
      } catch (error) {
        console.error('Failed to delete tag:', error);
      }
    }
  };

  // --- Hàm Xử lý Modal ---
  const handleOpenModal = (tag: TagDTO | null = null) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchTags(); // Tải lại danh sách sau khi lưu
  };

  return (
    <div className={styles.managerContainer}>
      <div className={styles.header}>
        <h1>Quản lý Thẻ (Tags)</h1>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          + Thêm Tag
        </button>
      </div>

      {loading && <div>Đang tải...</div>}

      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên Tag</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {!loading && tags.map((tag) => (
            <tr key={tag.id}>
              <td>{tag.id}</td>
              <td>{tag.name}</td>
              <td className={styles.actions}>
                <button onClick={() => handleOpenModal(tag)} className={styles.editButton}>
                  Sửa
                </button>
                <button onClick={() => handleDelete(tag.id)} className={styles.deleteButton}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <TagFormModal 
          initialData={editingTag}
          onClose={handleCloseModal}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
}