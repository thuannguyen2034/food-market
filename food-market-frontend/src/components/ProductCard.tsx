'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    const { user } = useAuth();
    const { cartMap, addToCart, updateCartItem } = useCart();
    
    // State loading cục bộ cho nút bấm để tránh spam
    const [isUpdating, setIsUpdating] = useState(false);

    // 1. Tính toán hiển thị giá
    // Discount % = (Base - Final) / Base * 100
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
            router.push('/login');
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

        // Chặn UI nếu vượt quá tồn kho
        if (newQty > product.stockQuantity) return;

        setIsUpdating(true);
        await updateCartItem(cartItemId, newQty);
        setIsUpdating(false);
    };

    return (
        <div className={styles.card}>
            {/* Vùng ảnh và thông tin */}
            <Link href={productUrl} className={styles.cardLink}>
                <div className={styles.imageContainer}>
                    {product.images[0] && (
                        <img src={product.images[0].imageUrl} alt={product.name} />
                    )}
                    {/* Badge giảm giá */}
                    {discountPercent > 0 && (
                        <span className={styles.discountBadge}>-{discountPercent}%</span>
                    )}
                </div>
                
                <div className={styles.content}>
                    <h3 className={styles.name}>{product.name}</h3>
                    
                    {/* Hiển thị Giá */}
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
            <div className={styles.actionArea}>
                {/* Case 1: Hết hàng */}
                {product.stockQuantity <= 0 ? (
                    <button className={styles.outOfStockButton} disabled>
                        Hết hàng
                    </button>
                ) : (
                    /* Case 2: Còn hàng */
                    <>
                        {quantityInCart === 0 ? (
                            /* 2a. Chưa có trong giỏ -> Nút Thêm */
                            <button 
                                className={styles.addToCartButton}
                                onClick={handleInitialAdd}
                                disabled={isUpdating}
                            >
                                {isUpdating ? '...' : 'Thêm vào giỏ'}
                            </button>
                        ) : (
                            /* 2b. Đã có trong giỏ -> Nút +/- */
                            <div className={styles.quantityControl}>
                                <button 
                                    onClick={(e) => handleQuantityUpdate(e, -1)}
                                    disabled={isUpdating}
                                    className={styles.qtyBtn}
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
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Hiển thị cảnh báo nhỏ nếu sắp hết hàng */}
            {product.stockQuantity > 0 && product.stockQuantity < 10 && (
                <div className={styles.stockWarning}>
                    Chỉ còn {product.stockQuantity} sản phẩm
                </div>
            )}
        </div>
    );
}