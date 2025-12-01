'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// Đã xóa import Link vì ProductCard tự xử lý link
import { CategoryResponse, ProductResponse, PageResponse } from '@/types/product';
import ProductCard from '@/components/ProductCard'; // 1. Import Component
import styles from './SearchPage.module.css';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const searchQuery = searchParams.get('q') || '';
    const selectedCategory = searchParams.get('category') || null;
    const sortBy = searchParams.get('sort') || '';

    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [page, setPage] = useState<number>(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // Fetch Categories
    useEffect(() => {
        if (!searchQuery) {
            setCategories([]);
            return;
        }

        let cancelled = false;
        const fetchCategories = async () => {
            try {
                const resp = await fetch(`/api/v1/categories/search?keyword=${encodeURIComponent(searchQuery)}`);
                if (!cancelled && resp.ok) {
                    const data: CategoryResponse[] = await resp.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };

        fetchCategories();
        return () => {
            cancelled = true;
        };
    }, [searchQuery]);

    // Reset list when filters change
    useEffect(() => {
        setPage(0);
        setProducts([]);
        setHasMore(true);
    }, [searchQuery, selectedCategory, sortBy]);

    // Fetch Products
    const fetchProducts = useCallback(
        async (pageNum: number, append = false) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                if (selectedCategory) params.append('categorySlug', selectedCategory);
                if (sortBy) params.append('sort', sortBy);
                params.append('page', String(pageNum));
                params.append('size', '20');

                const resp = await fetch(`/api/v1/products?${params.toString()}`);
                if (!resp.ok) {
                    console.error('Failed to fetch products:', resp.statusText);
                    return;
                }

                const data: PageResponse<ProductResponse> = await resp.json();
                if (append) {
                    setProducts(prev => [...prev, ...data.content]);
                } else {
                    setProducts(data.content);
                }
                setHasMore(!data.last);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setLoading(false);
            }
        },
        [searchQuery, selectedCategory, sortBy]
    );

    useEffect(() => {
        fetchProducts(page, page > 0);
    }, [fetchProducts, page]);

    const updateUrl = (newQ?: string | null, newCategory?: string | null, newSort?: string | null) => {
        const params = new URLSearchParams();
        const q = newQ !== undefined ? newQ : searchQuery;
        const category = newCategory !== undefined ? newCategory : selectedCategory;
        const sort = newSort !== undefined ? newSort : sortBy;

        if (q) params.set('q', q);
        if (category) params.set('category', category);
        if (sort) params.set('sort', sort);

        const qs = params.toString();
        const newUrl = qs ? `/search?${qs}` : '/search';
        router.replace(newUrl, { scroll: false });
    };

    const handleCategoryFilter = (categorySlug: string | null) => {
        updateUrl(undefined, categorySlug, undefined);
    };

    const handleSortChange = (newSort: string) => {
        updateUrl(undefined, undefined, newSort);
    };

    const handleLoadMore = () => setPage(prev => prev + 1);

    // Đã xóa hàm formatPrice vì ProductCard tự xử lý

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Kết quả tìm kiếm{searchQuery && `: "${searchQuery}"`}</h1>

            {/* Matching Categories */}
            {categories.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Danh mục liên quan</h2>
                    <div className={styles.categoriesContainer}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryFilter(cat.slug)}
                                className={`${styles.categoryButton} ${selectedCategory === cat.slug ? styles.active : ''}`}
                            >
                                {cat.imageUrl && <img src={cat.imageUrl} alt={cat.name} className={styles.categoryImage} />}
                                {cat.name}
                            </button>
                        ))}
                        {selectedCategory && (
                            <button onClick={() => handleCategoryFilter(null)} className={styles.clearFilterButton}>
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </section>
            )}

            {/* Sort Controls */}
            <div className={styles.controls}>
                <span>Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
                    <option value="" hidden>Sắp xếp theo</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá thấp đến cao</option>
                    <option value="price_desc">Giá cao đến thấp</option>
                    <option value="best_selling">Bán chạy</option>
                </select>
            </div>

            {/* Products Grid */}
            {loading && page === 0 ? (
                <div className={styles.loading}>Đang tải...</div>
            ) : products.length === 0 ? (
                <div className={styles.empty}>Không tìm thấy sản phẩm nào</div>
            ) : (
                <>
                    <div className={styles.productsGrid}>
                        {products.map(product => (
                            // 2. Thay thế toàn bộ thẻ Link thủ công bằng ProductCard
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                // Có thể truyền categorySlug nếu muốn cố định URL theo filter hiện tại,
                                // nhưng để null thì ProductCard sẽ dùng slug gốc của sản phẩm (tốt hơn).
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div className={styles.loadMore}>
                            <button onClick={handleLoadMore} disabled={loading} className={styles.loadMoreButton}>
                                {loading ? 'Đang tải...' : 'Xem thêm'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}