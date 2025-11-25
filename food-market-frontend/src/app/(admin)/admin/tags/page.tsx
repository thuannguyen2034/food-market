'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import TagFormModal from '@/components/Admin/TagFormModal';
import { Tag, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import styles from '@/styles/admin/Tags.module.css';

// Type DTO
type TagDTO = {
  id: number;
  name: string;
};

export default function TagManagerPage() {
  const { authedFetch } = useAuth();
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filteredTags, setFilteredTags] = useState<TagDTO[]>([]);

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
        setFilteredTags(tagList);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Filter tags based on search
  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredTags(tags);
    } else {
      const filtered = tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredTags(filtered);
    }
  }, [searchInput, tags]);

  // --- Hàm Xử lý Xóa ---
  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa tag này?')) {
      try {
        const res = await authedFetch(`/api/v1/admin/tags/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert('✅ Xóa thành công');
          fetchTags();
        } else {
          alert('❌ Lỗi khi xóa tag.');
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
    fetchTags();
  };

  const handleRefresh = () => {
    fetchTags();
  };

  return (
    <div className={styles.tagsContainer}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1><Tag className="inline-icon" size={32} style={{ marginBottom: -6, marginRight: 10 }} /> Quản lý Tags</h1>
        <div className={styles.headerActions}>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            <RefreshCw size={18} style={{ marginRight: 8 }} /> Làm mới
          </button>
          <button onClick={() => handleOpenModal()} className={styles.addButton}>
            <Plus size={18} style={{ marginRight: 8 }} /> Thêm Tag
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className={styles.statsCard}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}><Tag size={24} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{tags.length}</div>
            <div className={styles.statLabel}>Tổng số Tags</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Tìm kiếm tag..."
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
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.tagsTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Tag</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.centerText}>
                        {searchInput ? 'Không tìm thấy tag nào.' : 'Chưa có tag nào.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTags.map((tag) => (
                      <tr key={tag.id}>
                        <td>
                          <span className={styles.idBadge}>#{tag.id}</span>
                        </td>
                        <td>
                          <span className={styles.tagName}>{tag.name}</span>
                        </td>
                        <td className={styles.actions}>
                          <button
                            onClick={() => handleOpenModal(tag)}
                            className={styles.editButton}
                            title="Sửa tag"
                          >
                            <Edit size={16} /> Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className={styles.deleteButton}
                            title="Xóa tag"
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
          </>
        )}
      </div>

      {/* Modal */}
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