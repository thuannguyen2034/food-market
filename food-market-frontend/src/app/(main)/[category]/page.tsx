'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { ProductResponse, CategoryResponse, PageResponse } from '@/types/product';
import styles from './CategoryPage.module.css';

export default function CategoryPage() {
    const params = useParams();
    const categorySlug = params.category as string;

    const [currentCategory, setCurrentCategory] = useState<CategoryResponse | null>(null);
    const [siblingCategories, setSiblingCategories] = useState<CategoryResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observerTarget = useRef(null);

    // Fetch sibling categories (same root)
    useEffect(() => {
        const fetchSiblingCategories = async () => {
            try {
                const response = await fetch(
                    `/api/v1/categories/same-root?categorySlug=${categorySlug}`
                );
                if (response.ok) {
                    const data: CategoryResponse[] = await response.json();
                    setSiblingCategories(data);
                        // Find current category from siblings
                    const current = data.find(cat => cat.slug === categorySlug);
                    if (current) {
                        setCurrentCategory(current);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch sibling categories:', error);
            }
        };

        fetchSiblingCategories();
    }, [categorySlug]);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async (pageNum: number, append: boolean = false) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('categorySlug', categorySlug);
                params.append('sort', sortBy);
                params.append('page', pageNum.toString());
                params.append('size', '20');

                const response = await fetch(`/api/v1/products?${params.toString()}`);
                if (response.ok) {
                    const data: PageResponse<ProductResponse> = await response.json();
                    if (append) {
                        setProducts(prev => [...prev, ...data.content]);
                    } else {
                        setProducts(data.content);
                    }
                    setHasMore(!data.last);
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts(page, page > 0);
    }, [categorySlug, sortBy, page]);

    const handleSortChange = (newSort: string) => {
        setSortBy(newSort);
        setPage(0);
    };

    // Infinite scroll with Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading]);

    return (
        <div className={styles.container}>
            {/* Category Header */}
            <div className={styles.breadcrumb}>
                <Link href="/" className={styles.breadcrumbLink}>Trang chủ</Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>{currentCategory?.name}</span>
            </div>
            {currentCategory && (
                <div className={styles.categoryHeader}>
                    {currentCategory.imageUrl && (
                        <img src={currentCategory.imageUrl} alt={currentCategory.name} className={styles.categoryImage} />
                    )}
                    <h1>{currentCategory.name}</h1>
                </div>
            )}

            {/* Sibling Categories */}
            {siblingCategories.length > 0 && (
                <div className={styles.siblingCategories}>
                    {siblingCategories.map(cat => (
                        <Link
                            key={cat.id}
                            href={`/${cat.slug}`}
                            className={`${styles.categoryChip} ${cat.slug === categorySlug ? styles.active : ''}`}
                        >
                            {cat.imageUrl && (
                                <img src={cat.imageUrl} alt={cat.name} className={styles.categoryChipImage} />
                            )}
                            {cat.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* Sort Controls */}
            <div className={styles.controls}>
                <span>Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá thấp đến cao</option>
                    <option value="price_desc">Giá cao đến thấp</option>
                    <option value="best_selling">Bán chạy</option>
                </select>
            </div>

            {/* Products Grid */}
            {products.length === 0 && !loading ? (
                <div className={styles.empty}>Không có sản phẩm nào</div>
            ) : (
                <>
                    <div className={styles.productsGrid}>
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                categorySlug={categorySlug}
                            />
                        ))}
                    </div>

                    {/* Intersection Observer Target */}
                    <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />

                    {loading && (
                        <div className={styles.loadMore}>
                            <span>Đang tải...</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
