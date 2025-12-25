'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/admin/Recipes.module.css'; 
import {
  ChefHat,
  Plus,
  Search,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


type RecipeResponse = {
  id: number;
  name: string;
  imageUrl: string;
  cookingSteps: string;
  ingredients: string;
  tags: string;
  productIds: number[];
  createdAt: string;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
};

export default function RecipeListPage() {
  const { authedFetch } = useAuth();

  const [dataPage, setDataPage] = useState<PageResponse<RecipeResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');

  // Fetch dữ liệu
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '10');
      if (keyword) params.append('keyword', keyword); // Map với RecipeFilter

      const res = await authedFetch(`/api/v1/admin/recipes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDataPage(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authedFetch, page, keyword]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Handle Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); 
    fetchRecipes(); 
  };

  // UI Helper
  const renderTags = (tagString: string) => {
    if (!tagString) return null;
    return tagString.split(',').map((tag, idx) => (
      <span key={idx} className={styles.tagBadge}>{tag.trim()}</span>
    ));
  };

  // Format nguyên liệu: thay | bằng ,
  const formatIngredients = (ingredientsStr: string) => {
    if (!ingredientsStr) return '';
    return ingredientsStr.split('|').join(', ');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1><ChefHat size={32} className="inline-icon" style={{ marginBottom: -6, marginRight: 10 }} /> Quản lý Công thức</h1>
        <div className={styles.actions}>
          <button onClick={fetchRecipes} className={styles.refreshBtn}><RefreshCw size={18} /> Làm mới</button>
          <Link href="/admin/recipes/new" className={styles.addBtn}><Plus size={18} /> Thêm mới</Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Tìm theo tên công thức..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}><Search size={18} /> Tìm</button>
        </form>
      </div>
      {/* Pagination */}
      {dataPage && dataPage.totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={dataPage.first} className={styles.pageBtn}>
            <ChevronLeft size={16} />
          </button>
          <span>Trang {dataPage.number + 1} / {dataPage.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(dataPage.totalPages - 1, p + 1))} disabled={dataPage.last} className={styles.pageBtn}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tên món & Nguyên liệu</th>
              <th>Tags (AI)</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {dataPage?.content.length === 0 ? (
              <tr><td colSpan={5} className={styles.centerText}>Chưa có công thức nào.</td></tr>
            ) : (
              dataPage?.content.map(recipe => (
                <tr key={recipe.id}>
                  <td>#{recipe.id}</td>
                  <td>
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.name} className={styles.thumb} />
                    ) : <div className={styles.noImg}>No Img</div>}
                  </td>
                  <td>
                    <div className={styles.recipeName}>{recipe.name}</div>
                    <div className={styles.ingredientsPreview}>
                      {(() => {
                        const formatted = formatIngredients(recipe.ingredients);
                        return formatted.length > 50
                          ? formatted.substring(0, 50) + '...'
                          : formatted;
                      })()}
                    </div>
                  </td>
                  <td>
                    <div className={styles.tagsWrapper}>
                      {renderTags(recipe.tags)}
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/recipes/${recipe.id}`} className={styles.editBtn}>
                      <Edit size={16} /> Sửa
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}