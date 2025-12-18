'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ProductResponse } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    product: ProductResponse;
    categorySlug?: string;
}

export default function ProductCard({ product, categorySlug }: ProductCardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { cartMap, addToCart, updateCartItem } = useCart();

    const [isUpdating, setIsUpdating] = useState(false);
    const [stockQuantity, setStockQuantity] = useState(product.stockQuantity);
    // 1. Tính toán hiển thị giá
    const discountPercent = product.basePrice > product.finalPrice
        ? Math.round(((product.basePrice - product.finalPrice) / product.basePrice) * 100)
        : 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const productUrl = categorySlug
        ? `/${categorySlug}/${product.slug}`
        : `/${product.category.slug}/${product.slug}`;

    // 2. Logic Sync với Cart
    // Tra cứu trong CartMap xem sản phẩm này có trong giỏ không
    const cartItemInfo = cartMap[product.id];
    const quantityInCart = cartItemInfo ? cartItemInfo.quantity : 0;
    const cartItemId = cartItemInfo ? cartItemInfo.cartItemId : null;

    // Handler: Thêm mới (khi SL = 0)
    const handleInitialAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            const returnUrl = encodeURIComponent(pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }
        if (isUpdating) return;

        setIsUpdating(true);
        await addToCart(product.id, 1);
        setIsUpdating(false);
    };

    // Handler: Tăng giảm số lượng (khi SL > 0)
    const handleQuantityUpdate = async (e: React.MouseEvent, delta: number) => {
        e.preventDefault();
        if (!user || !cartItemId || isUpdating) return;

        const newQty = quantityInCart + delta;
        const productResponse = await fetch(`/api/v1/products/${product.slug}`);
        const productData = await productResponse.json();
        const newMaxQty = productData.stockQuantity;
        if (newQty > newMaxQty) return;
        setStockQuantity(newMaxQty);
        setIsUpdating(true);
        await updateCartItem(cartItemId, newQty);
        setIsUpdating(false);
    };

    return (
        <div className={styles.card}>
            {/* Vùng ảnh */}
            <Link href={productUrl} className={styles.cardLink}>
                <div className={styles.imageContainer}>
                    {product.images[0] ? (
                        <img src={product.images[0].imageUrl} alt={product.name} />
                    ) : (
                        // Placeholder nếu không có ảnh
                        <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                            No Image
                        </div>
                    )}

                    {discountPercent > 0 && (
                        <span className={styles.discountBadge}>-{discountPercent}%</span>
                    )}
                </div>

                <div className={styles.content}>
                    <h3 className={styles.name} title={product.name}>{product.name}</h3>

                    <div className={styles.priceSection}>
                        <div className={styles.finalPrice}>
                            {formatPrice(product.finalPrice)}
                        </div>
                        {discountPercent > 0 && (
                            <div className={styles.basePrice}>
                                {formatPrice(product.basePrice)}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Vùng nút bấm Action */}
            {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && (
                <div className={styles.actionArea}>
                    {product.stockQuantity <= 0 ? (
                        <button className={styles.outOfStockButton} disabled>
                            Hết hàng
                        </button>
                    ) : (
                        <>
                            {quantityInCart === 0 ? (
                                <button
                                    className={styles.addToCartButton}
                                    onClick={handleInitialAdd}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? '...' : 'Thêm vào giỏ'}
                                </button>
                            ) : (
                                <div className={styles.quantityControl}>
                                    <button
                                        onClick={(e) => handleQuantityUpdate(e, -1)}
                                        disabled={isUpdating}
                                        className={styles.qtyBtn}
                                        type="button"
                                    >
                                        -
                                    </button>

                                    <span className={styles.qtyValue}>
                                        {isUpdating ? '...' : quantityInCart}
                                    </span>

                                    <button
                                        onClick={(e) => handleQuantityUpdate(e, 1)}
                                        disabled={isUpdating || quantityInCart >= product.stockQuantity}
                                        className={styles.qtyBtn}
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Cảnh báo tồn kho */}
            {stockQuantity > 0 && stockQuantity < 50 && (
                <div className={styles.stockWarning}>
                    Còn {stockQuantity} sản phẩm
                </div>
            )}
        </div>
    );
}