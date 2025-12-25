'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Flame, ShoppingCart, Plus, Minus, Star } from 'lucide-react'; // Đảm bảo import đủ icon
import { ProductResponse } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    product: ProductResponse;
    categorySlug?: string;
    variant?: 'default' | 'flash'; // Mặc định là 'default'
}

export default function ProductCard({
    product,
    categorySlug,
    variant = 'default'
}: ProductCardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { cartMap, addToCart, updateCartItem } = useCart();

    const [isUpdating, setIsUpdating] = useState(false);

    // Logic hiển thị giá
    const discountPercent = product.basePrice > product.finalPrice
        ? Math.round(((product.basePrice - product.finalPrice) / product.basePrice) * 100)
        : 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Format số lượng đã bán (Ví dụ: 1200 -> 1.2k)
    const formatSold = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    };

    const productUrl = categorySlug
        ? `/${categorySlug}/${product.slug}`
        : `/${product.category.slug}/${product.slug}`;

    // Logic Giỏ hàng
    const cartItemInfo = cartMap[product.id];
    const quantityInCart = cartItemInfo ? cartItemInfo.quantity : 0;
    const cartItemId = cartItemInfo ? cartItemInfo.cartItemId : null;

    const handleInitialAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }
        if (isUpdating) return;
        setIsUpdating(true);
        await addToCart(product.id, 1);
        setIsUpdating(false);
    };

    const handleQuantityUpdate = async (e: React.MouseEvent, delta: number) => {
        e.preventDefault();
        if (!user || !cartItemId || isUpdating) return;
        const newQty = quantityInCart + delta;
        if (newQty > product.stockQuantity) return;
        setIsUpdating(true);
        await updateCartItem(cartItemId, newQty);
        setIsUpdating(false);
    };

    return (
        <div className={`${styles.card} ${variant === 'flash' ? styles.flashCard : ''}`}>
            {/* Vùng Ảnh */}
            <Link href={productUrl} className={styles.cardLink}>
                <div className={styles.imageContainer}>
                    <img
                        src={product.images[0]?.imageUrl || '/placeholder.png'}
                        alt={product.name}
                    />

                    {/* Badge giảm giá */}
                    {discountPercent > 0 && (
                        <span className={styles.discountBadge}>
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                <div className={styles.content}>
                    <h3 className={styles.name} title={product.name}>{product.name}</h3>
                    {product.rating != null && product.rating > 0 && (
                        <div className={styles.ratingRow}>
                            <div className={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={10} // Sao nhỏ tinh tế
                                        fill={star <= Math.round(product.rating || 0) ? "#ffce3d" : "transparent"}
                                        color={star <= Math.round(product.rating || 0) ? "#ffce3d" : "#ddd"}
                                    />
                                ))}
                            </div>
                            <span className={styles.ratingNum}>{product.rating}</span>
                        </div>
                    )}
                    {/* Vùng Giá & Đã bán */}
                    <div className={styles.metaRow}>
                        <div className={styles.priceColumn}>
                            <span className={styles.finalPrice}>{formatPrice(product.finalPrice)}</span>
                            {discountPercent > 0 && (
                                <span className={styles.basePrice}>{formatPrice(product.basePrice)}
                                    <span className={styles.unit}>/{product.unit}</span></span>
                            )}
                        </div>

                        {/* Hiển thị số lượng đã bán */}
                        {product.soldCount > 0 && (
                            <div className={`${styles.soldTag} ${variant === 'flash' ? styles.soldTagHot : ''}`}>
                                {variant === 'flash' && <Flame size={12} fill="#e74c3c" />}
                                <span>Đã bán {formatSold(product.soldCount)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Nút Mua Hàng - Luôn hiển thị để kích thích mua sắm */}
            {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && (
                <div className={styles.actionArea}>
                    {product.stockQuantity <= 0 ? (
                        <button className={styles.outOfStockBtn} disabled>Hết hàng</button>
                    ) : (
                        quantityInCart === 0 ? (
                            <button
                                className={styles.addToCartBtn}
                                onClick={handleInitialAdd}
                                disabled={isUpdating}
                            >
                                <ShoppingCart size={16} /> Thêm vào giỏ
                            </button>
                        ) : (
                            <div className={styles.qtyControl}>
                                <button onClick={(e) => handleQuantityUpdate(e, -1)} className={styles.qtyBtn}><Minus size={14} /></button>
                                <span className={styles.qtyValue}>{quantityInCart}</span>
                                <button onClick={(e) => handleQuantityUpdate(e, 1)} className={styles.qtyBtn}><Plus size={14} /></button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}