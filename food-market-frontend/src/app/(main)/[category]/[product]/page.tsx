'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation'; // Thêm usePathname
import Link from 'next/link';
import { ProductResponse, ReviewResponse, PageResponse } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import styles from './ProductDetail.module.css';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname(); // Lấy đường dẫn hiện tại để redirect
    const categorySlug = params.category as string;
    const productSlug = params.product as string;

    const { user } = useAuth();
    const { addToCart, updateCartItem, cartMap } = useCart();

    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedStartIndex, setRelatedStartIndex] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- Derived Data ---
    const cartItemInfo = product ? cartMap[product.id] : undefined;
    const qtyInCart = cartItemInfo ? cartItemInfo.quantity : 0;
    const cartItemId = cartItemInfo ? cartItemInfo.cartItemId : null;

    const discountPercent = (product && product.basePrice > product.finalPrice)
        ? Math.round(((product.basePrice - product.finalPrice) / product.basePrice) * 100)
        : 0;

    // --- Fetching Logic (Giữ nguyên) ---
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/v1/products/${productSlug}`);
                if (!response.ok) {
                    setError('Không tìm thấy sản phẩm');
                    return;
                }
                const productDetail: ProductResponse = await response.json();
                setProduct(productDetail);
            } catch (err) {
                setError('Không thể tải thông tin sản phẩm');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productSlug]);

    useEffect(() => {
        if (!product) return;
        const fetchReviews = async () => {
            try {
                const response = await fetch(`/api/v1/reviews/product/${product.id}?page=0&size=10`);
                if (response.ok) {
                    const data: PageResponse<ReviewResponse> = await response.json();
                    setReviews(data.content);
                    setTotalReviews(data.totalElements);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchReviews();
    }, [product]);

    useEffect(() => {
        if (!product) return;
        const fetchRelatedProducts = async () => {
            try {
                const response = await fetch(`/api/v1/products?categorySlug=${categorySlug}&size=10`);
                if (response.ok) {
                    const data: PageResponse<ProductResponse> = await response.json();
                    const related = data.content.filter(p => p.id !== product.id);
                    setRelatedProducts(related);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchRelatedProducts();
    }, [product, categorySlug]);

    // --- Logic Handler ---

    const handleInitialAdd = async () => {
        if (!product) return;
        if (!user) {
            // Logic Redirect: Lưu đường dẫn hiện tại vào returnUrl
            const returnUrl = encodeURIComponent(pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }
        if (isUpdating) return;

        setIsUpdating(true);
        await addToCart(product.id, 1);
        setIsUpdating(false);
    };

    const handleQuantityUpdate = async (delta: number) => {
        if (!user || !cartItemId || isUpdating) return;
        const newQty = qtyInCart + delta;
        if (product && newQty > product.stockQuantity) return;
        
        setIsUpdating(true);
        await updateCartItem(cartItemId, newQty);
        setIsUpdating(false);
    };

    // --- Helper Functions ---
    const formatPrice = (price: number) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    
    const formatDate = (dateString: string) => 
        new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

    const renderStars = (rating: number) => 
        Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
        ));

    const currentImage = product?.images[selectedImageIndex] || product?.images[0];
    const displayRating = product?.averageRating ?? 
        (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

    const nextImage = () => product && setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    const prevImage = () => product && setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    
    // Related Carousel
    const relatedItemsPerPage = 4;
    const nextRelated = () => { if (relatedStartIndex + relatedItemsPerPage < relatedProducts.length) setRelatedStartIndex(relatedStartIndex + 1); };
    const prevRelated = () => { if (relatedStartIndex > 0) setRelatedStartIndex(relatedStartIndex - 1); };
    const visibleRelatedProducts = relatedProducts.slice(relatedStartIndex, relatedStartIndex + relatedItemsPerPage);

    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div>Đang tải...</div>;
    if (error || !product) return <div className={styles.errorContainer}>{error || 'Không tìm thấy sản phẩm'}</div>;

    return (
        <div className={styles.container}>
            {/* 1. Breadcrumb Navigation (Mới) */}
            <div className={styles.breadcrumb}>
                <Link href="/" className={styles.breadcrumbLink}>Trang chủ</Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <Link href={`/${categorySlug}`} className={styles.breadcrumbLink}>
                    {product.category.name}
                </Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>{product.name}</span>
            </div>

            <div className={styles.productSection}>
                {/* Image Gallery */}
                <div className={styles.imageGallery}>
                    <div className={styles.mainImageContainer}>
                        {currentImage ? (
                            <img src={currentImage.imageUrl} alt={product.name} className={styles.mainImage}/>
                        ) : (
                            <div className={styles.noImage}>No Image</div>
                        )}
                        {product.images.length > 1 && (
                            <>
                                <button className={styles.navButtonPrev} onClick={prevImage}>‹</button>
                                <button className={styles.navButtonNext} onClick={nextImage}>›</button>
                            </>
                        )}
                        {discountPercent > 0 && <span className={styles.discountBadge}>-{discountPercent}%</span>}
                    </div>
                    {product.images.length > 1 && (
                        <div className={styles.thumbnails}>
                            {product.images.map((img, idx) => (
                                <div 
                                    key={img.id} 
                                    className={`${styles.thumbnailWrapper} ${idx === selectedImageIndex ? styles.thumbnailActive : ''}`}
                                    onClick={() => setSelectedImageIndex(idx)}
                                >
                                    <img src={img.imageUrl} alt="thumbnail" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className={styles.productInfo}>
                    <h1 className={styles.productName}>{product.name}</h1>
                    
                    <div className={styles.ratingAndSold}>
                        <div className={styles.stars}>{renderStars(Math.round(displayRating))}</div>
                        <span className={styles.ratingText}>({displayRating.toFixed(1)})</span>
                        <span className={styles.divider}>|</span>
                        <span className={styles.soldCount}>Đã bán 100+</span>
                    </div>

                    <div className={styles.priceBlock}>
                        <div className={styles.finalPrice}>{formatPrice(product.finalPrice)}</div>
                        {discountPercent > 0 && (
                            <div className={styles.originalPriceBlock}>
                                <span className={styles.basePrice}>{formatPrice(product.basePrice)}</span>
                                <span className={styles.discountLabel}>Giảm {discountPercent}%</span>
                            </div>
                        )}
                    </div>

                    {/* Short Specs / Description excerpt could go here */}

                    <div className={styles.stockStatus}>
                        {product.stockQuantity > 0 ? (
                            <span className={styles.stockAvailable}>
                                Tình trạng: <b>Còn hàng</b> ({product.stockQuantity} {product.unit})
                            </span>
                        ) : (
                            <span className={styles.stockUnavailable}>Tình trạng: <b>Hết hàng</b></span>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className={styles.actionArea}>
                        {product.stockQuantity > 0 && user?.role !== 'ADMIN' && (
                            <>
                                {qtyInCart === 0 ? (
                                    <button 
                                        className={styles.addToCartBtn} 
                                        onClick={handleInitialAdd}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
                                    </button>
                                ) : (
                                    <div className={styles.cartControlBlock}>
                                        <div className={styles.quantitySelector}>
                                            <button onClick={() => handleQuantityUpdate(-1)} disabled={isUpdating}>-</button>
                                            <input type="text" value={isUpdating ? '...' : qtyInCart} readOnly />
                                            <button onClick={() => handleQuantityUpdate(1)} disabled={isUpdating || qtyInCart >= product.stockQuantity}>+</button>
                                        </div>
                                        <div className={styles.inCartMessage}>
                                            <span>✓ Đã có trong giỏ</span>
                                            <Link href="/cart">Xem giỏ hàng</Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {product.stockQuantity <= 0 && (
                            <button className={styles.outOfStockBtn} disabled>Liên hệ khi có hàng</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className={styles.sectionContainer}>
                <h3 className={styles.sectionTitle}>Chi tiết sản phẩm</h3>
                <div className={styles.detailsContent}>
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <table className={styles.specsTable}>
                            <tbody>
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td>{value}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td>Đơn vị tính</td>
                                    <td>{product.unit}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                    {product.description && (
                        <div className={styles.descriptionHtml} dangerouslySetInnerHTML={{ __html: product.description }} />
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className={styles.sectionContainer}>
                <h3 className={styles.sectionTitle}>Đánh giá ({totalReviews})</h3>
                <div className={styles.reviewList}>
                    {reviews.length > 0 ? reviews.map((review) => (
                        <div key={review.id} className={styles.reviewItem}>
                            <div className={styles.reviewAvatar}>{review.userName[0]}</div>
                            <div className={styles.reviewContent}>
                                <div className={styles.reviewUser}>{review.userName}</div>
                                <div className={styles.reviewStars}>{renderStars(review.rating)}</div>
                                <div className={styles.reviewDate}>{formatDate(review.createdAt)}</div>
                                <p className={styles.reviewText}>{review.comment}</p>
                            </div>
                        </div>
                    )) : (
                        <p className={styles.emptyText}>Chưa có đánh giá nào cho sản phẩm này.</p>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className={styles.relatedSection}>
                    <h3 className={styles.sectionTitle}>Sản phẩm liên quan</h3>
                    <div className={styles.relatedGrid}>
                        {visibleRelatedProducts.map((p) => (
                            <ProductCard key={p.id} product={p} categorySlug={categorySlug} />
                        ))}
                    </div>
                    {/* Add pagination controls if needed */}
                </div>
            )}
        </div>
    );
}