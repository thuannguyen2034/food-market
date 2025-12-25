'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RecipeForm from '@/app/(admin)/admin/recipes/components/RecipeForm';

export default function EditRecipePage() {
  const { id } = useParams();
  const { authedFetch } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await authedFetch(`/api/v1/admin/recipes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRecipe(data);
        } else {
          alert('Không tìm thấy công thức');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, authedFetch]);

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (!recipe) return <div>Lỗi: Không tìm thấy dữ liệu.</div>;

  return <RecipeForm initialData={recipe} isEditMode={true} />;
}