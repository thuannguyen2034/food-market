'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductResponse, ReviewResponse, PageResponse } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import styles from './ProductDetail.module.css';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const categorySlug = params.category as string;
    const productSlug = params.product as string;

    const { user } = useAuth();
    // 1. Thêm updateCartItem vào destructuring
    const { addToCart, updateCartItem, cartMap } = useCart();

    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    
    // Xóa state quantity cục bộ, chỉ giữ loading state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedStartIndex, setRelatedStartIndex] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false); // Đổi tên cho rõ nghĩa

    // --- Derived Data từ CartContext ---
    const cartItemInfo = product ? cartMap[product.id] : undefined;
    const qtyInCart = cartItemInfo ? cartItemInfo.quantity : 0;
    const cartItemId = cartItemInfo ? cartItemInfo.cartItemId : null;

    // Tính discount %
    const discountPercent = (product && product.basePrice > product.finalPrice)
        ? Math.round(((product.basePrice - product.finalPrice) / product.basePrice) * 100)
        : 0;

    // Fetch Product ... (Giữ nguyên)
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

    // Fetch Reviews ... (Giữ nguyên)
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

    // Fetch Related ... (Giữ nguyên)
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

    // --- 2. Logic Handler Mới (Giống ProductCard) ---

    // Case 1: Chưa có trong giỏ -> Thêm mới (1 sản phẩm)
    const handleInitialAdd = async () => {
        if (!product) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (isUpdating) return;

        setIsUpdating(true);
        await addToCart(product.id, 1);
        setIsUpdating(false);
    };

    // Case 2: Đã có trong giỏ -> Update số lượng (+/-)
    const handleQuantityUpdate = async (delta: number) => {
        if (!user || !cartItemId || isUpdating) return;

        const newQty = qtyInCart + delta;
        // Chặn UI nếu vượt quá tồn kho (ProductCard logic)
        if (product && newQty > product.stockQuantity) return;
        // Nếu giảm về 0, Context sẽ tự gọi API xóa
        
        setIsUpdating(true);
        await updateCartItem(cartItemId, newQty);
        setIsUpdating(false);
    };

    // Helper functions (Format, Date, Star...) giữ nguyên
    const formatPrice = (price: number) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    
    const formatDate = (dateString: string) => 
        new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

    const renderStars = (rating: number) => 
        Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
        ));

    // Logic Carousel & Render ... (Giữ nguyên phần đầu)
    const currentImage = product?.images[selectedImageIndex] || product?.images[0];
    const displayRating = product?.averageRating ?? 
        (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

    const nextImage = () => product && setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    const prevImage = () => product && setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    
    // Related logic...
    const relatedItemsPerPage = 4;
    const nextRelated = () => { if (relatedStartIndex + relatedItemsPerPage < relatedProducts.length) setRelatedStartIndex(relatedStartIndex + 1); };
    const prevRelated = () => { if (relatedStartIndex > 0) setRelatedStartIndex(relatedStartIndex - 1); };
    const visibleRelatedProducts = relatedProducts.slice(relatedStartIndex, relatedStartIndex + relatedItemsPerPage);

    if (loading) return <div className={styles.loading}>Đang tải...</div>;
    if (error || !product) return <div className={styles.error}>{error || 'Không tìm thấy sản phẩm'}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.productSection}>
                {/* Image Gallery (Giữ nguyên) */}
                <div className={styles.imageGallery}>
                    <div className={styles.mainImageContainer}>
                        {currentImage && <img src={currentImage.imageUrl} alt={product.name} />}
                        {product.images.length > 1 && (
                            <>
                                <button className={styles.navButtonPrev} onClick={prevImage}>‹</button>
                                <button className={styles.navButtonNext} onClick={nextImage}>›</button>
                            </>
                        )}
                    </div>
                    {product.images.length > 1 && (
                        <div className={styles.thumbnails}>
                            {product.images.map((img, idx) => (
                                <img
                                    key={img.id}
                                    src={img.imageUrl}
                                    alt={`${product.name} ${idx + 1}`}
                                    className={idx === selectedImageIndex ? styles.thumbnailActive : ''}
                                    onClick={() => setSelectedImageIndex(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className={styles.productInfo}>
                    <h1>{product.name}</h1>
                    {/* Rating... */}
                    {product.averageRating !== undefined && (
                        <div className={styles.productRating}>
                            <div className={styles.stars}>{renderStars(Math.round(product.averageRating))}</div>
                            <span className={styles.ratingText}>({product.averageRating.toFixed(1)})</span>
                        </div>
                    )}
                    
                    <div className={styles.category}>
                        <Link href={`/${categorySlug}`}>{product.category.name}</Link>
                    </div>

                    <div className={styles.priceSection}>
                        <div className={styles.finalPrice}>{formatPrice(product.finalPrice)}</div>
                        {discountPercent > 0 && (
                            <div className={styles.priceDetails}>
                                <span className={styles.basePrice}>{formatPrice(product.basePrice)}</span>
                                <span className={styles.discount}>-{discountPercent}%</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.stockInfo}>
                        {product.stockQuantity > 0 ? (
                            <>
                                <span className={styles.inStock}>Còn hàng ({product.stockQuantity} {product.unit})</span>
                                {/* Thông báo đã có trong giỏ hàng */}
                                {qtyInCart > 0 && (
                                    <div style={{ color: '#28a745', fontSize: '0.9rem', marginTop: '5px', fontWeight: '500' }}>
                                        ✓ Hiện có {qtyInCart} {product.unit} trong giỏ hàng
                                    </div>
                                )}
                            </>
                        ) : (
                            <span className={styles.outOfStock}>Hết hàng</span>
                        )}
                    </div>

                    {/* --- 3. KHU VỰC ACTION (Thay đổi lớn ở đây) --- */}
                    {product.stockQuantity > 0 && user?.role !== 'ADMIN' && (
                        <div className={styles.addToCart}>
                            {qtyInCart === 0 ? (
                                /* --- TRẠNG THÁI 1: CHƯA CÓ TRONG GIỎ (Nút Thêm Lớn) --- */
                                <button 
                                    className={styles.addToCartBtn} 
                                    onClick={handleInitialAdd}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
                                </button>
                            ) : (
                                /* --- TRẠNG THÁI 2: ĐÃ CÓ (Control + - gọi API trực tiếp) --- */
                                <div className={styles.quantityControlWrapper}>
                                    <div className={styles.quantitySelector}>
                                        <button 
                                            onClick={() => handleQuantityUpdate(-1)}
                                            disabled={isUpdating}
                                            className={styles.qtyBtn}
                                        >
                                            -
                                        </button>
                                        
                                        <div className={styles.qtyDisplay}>
                                            {isUpdating ? '...' : qtyInCart}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleQuantityUpdate(1)}
                                            disabled={isUpdating || qtyInCart >= product.stockQuantity}
                                            className={styles.qtyBtn}
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    {/* Link dẫn tới giỏ hàng cho tiện */}
                                    <Link href="/cart" className={styles.viewCartLink}>
                                        Xem giỏ hàng &rarr;
                                    </Link>
                                </div>
                            )}
                            
                            {/* Warning nếu full kho */}
                            {qtyInCart >= product.stockQuantity && (
                                <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Bạn đã đạt giới hạn số lượng trong kho.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Các phần Description, Reviews, Related Products giữ nguyên như cũ ... */}
            <div className={styles.detailsSection}>
                {product.description && (
                    <div className={styles.description}>
                        <h3>Mô tả sản phẩm</h3>
                        <div className={styles.descriptionContent} dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>
                )}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className={styles.specifications}>
                        <h3>Thông số kỹ thuật</h3>
                        <table>
                            <tbody>
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <tr key={key}>
                                        <td className={styles.specKey}>{key}</td>
                                        <td className={styles.specValue}>{value}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className={styles.specKey}>Đơn vị</td>
                                    <td className={styles.specValue}>{product.unit}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className={styles.reviewsSection}>
                <h2>Đánh giá sản phẩm</h2>
                {reviews.length > 0 ? (
                    <>
                        <div className={styles.reviewSummary}>
                            <div className={styles.avgRating}>
                                <span className={styles.ratingNumber}>{displayRating.toFixed(1)}</span>
                                <div className={styles.stars}>{renderStars(Math.round(displayRating))}</div>
                                <span className={styles.reviewCount}>({totalReviews} đánh giá)</span>
                            </div>
                        </div>
                        <div className={styles.reviewsList}>
                            {reviews.map((review) => (
                                <div key={review.id} className={styles.reviewItem}>
                                    <div className={styles.reviewHeader}>
                                        <span className={styles.reviewUser}>{review.userName}</span>
                                        <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                                    </div>
                                    <div className={styles.reviewRating}>{renderStars(review.rating)}</div>
                                    <p className={styles.reviewComment}>{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className={styles.noReviews}>Chưa có đánh giá nào</p>
                )}
            </div>

            {relatedProducts.length > 0 && (
                <div className={styles.relatedSection}>
                    <h2>Sản phẩm liên quan</h2>
                    <div className={styles.carouselContainer}>
                        {relatedStartIndex > 0 && (
                            <button className={styles.carouselButtonPrev} onClick={prevRelated}>‹</button>
                        )}
                        <div className={styles.relatedGrid}>
                            {visibleRelatedProducts.map((relatedProduct) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    categorySlug={categorySlug}
                                />
                            ))}
                        </div>
                        {relatedStartIndex + relatedItemsPerPage < relatedProducts.length && (
                            <button className={styles.carouselButtonNext} onClick={nextRelated}>›</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}