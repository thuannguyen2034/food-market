'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { RecipeDetailDTO } from '@/types/recipe';
import { RECIPE_TAGS, getTagLabel } from '@/constants/recipeTags'; // Import thêm constant tag nếu cần hiển thị đẹp
import styles from './RecipeDetail.module.css';

export default function RecipeDetailPage() {
    const { id } = useParams();
    const [data, setData] = useState<RecipeDetailDTO | null>(null);

    useEffect(() => {
        // Giả lập fetch data
        fetch(`/api/v1/storefront/recipes/${id}`)
            .then(res => res.json())
            .then(setData)
            .catch(err => console.error(err));
    }, [id]);

    if (!data) return <div className={styles.loading}>Đang tải công thức...</div>;

    const { recipeInfo, products } = data;

    // --- XỬ LÝ DỮ LIỆU ---
    // 1. Tách chuỗi Tags
    const tags = recipeInfo.tags ? recipeInfo.tags.split(',') : [];

    // 2. Tách chuỗi Nguyên liệu (dựa trên dấu |)
    const ingredientList = recipeInfo.ingredients
        ? recipeInfo.ingredients.split('|').filter(item => item.trim() !== '')
        : [];

    // 3. Tách chuỗi Cách làm (dựa trên dấu |)
    const stepList = recipeInfo.cookingSteps
        ? recipeInfo.cookingSteps.split('|').filter(item => item.trim() !== '')
        : [];

    return (
        <div className={styles.container}>
            <div className={styles.layout}>

                {/* --- CỘT TRÁI (2 phần): DANH SÁCH SẢN PHẨM --- */}
                <div className={styles.productsSection}>
                    <div className={styles.sectionHeader}>
                        <h2>🛒 Nguyên liệu có sẵn</h2>
                        <p>Thêm nhanh vào giỏ để trổ tài ngay!</p>
                    </div>

                    <div className={styles.productGrid}>
                        {products && products.length > 0 ? (
                            products.map(product => (
                                <div key={product.id} className={styles.productWrapper}>
                                    <ProductCard product={product} />
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyNote}>Hiện chưa có sản phẩm liên kết cho món này.</p>
                        )}
                    </div>
                </div>

                {/* --- CỘT PHẢI (1 phần): THÔNG TIN CÔNG THỨC (Sticky) --- */}
                <aside className={styles.recipeSidebar}>
                    {/* Ảnh & Tên */}
                    <div className={styles.recipeHeader}>
                        <img
                            src={recipeInfo.imageUrl || '/placeholder-recipe.jpg'}
                            alt={recipeInfo.name}
                            className={styles.recipeImage}
                        />
                        <h1 className={styles.recipeTitle}>{recipeInfo.name}</h1>

                        {/* Tags */}
                        <div className={styles.tagsWrapper}>
                            {tags.map(tag => (
                                <span key={tag.trim()} className={styles.tagBadge}>
                                    {getTagLabel(tag.trim())}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Nội dung cuộn bên trong sidebar (Compact) */}
                    <div className={styles.recipeScrollContent}>

                        {/* Phần Nguyên Liệu */}
                        <div className={styles.infoBlock}>
                            <h3>📝 Nguyên liệu</h3>
                            <ul className={styles.ingredientUl}>
                                {ingredientList.map((item, index) => (
                                    <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        </div>

                        <hr className={styles.divider} />

                        {/* Phần Cách Làm */}
                        <div className={styles.infoBlock}>
                            <h3>🍳 Cách làm</h3>
                            <div className={styles.stepsList}>
                                {stepList.map((step, index) => (
                                    <div key={index} className={styles.stepItem}>
                                        <span className={styles.stepNum}>{index + 1}</span>
                                        <p>{step.trim()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}