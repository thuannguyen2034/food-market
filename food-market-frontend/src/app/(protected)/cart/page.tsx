'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './CartPage.module.css';
import { CartItem } from '@/types/cart';
    import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { cartData, isLoadingCart, updateCartItem, removeCartItem } = useCart();
    const router = useRouter();
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };
    const handleCheckout = () => {
           router.push('/checkout');
    }
    if (isLoadingCart) {
        return <div className={styles.container}>Đang tải giỏ hàng...</div>;
    }

    if (!cartData || cartData.items.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyCart}>
                    <p>Giỏ hàng của bạn đang trống.</p>
                    <Link href="/" className={styles.emptyBtn}>
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Giỏ hàng ({cartData.items.length} món)</h1>

            <div className={styles.cartLayout}>
                {/* --- Cột trái: Danh sách sản phẩm --- */}
                <div className={styles.itemList}>
                    {cartData.items.map((item) => (
                        <CartItemRow 
                            key={item.cartItemId} 
                            item={item} 
                            onUpdate={updateCartItem}
                            onRemove={removeCartItem}
                            formatPrice={formatPrice}
                        />
                    ))}
                </div>

                {/* --- Cột phải: Tổng tiền & Checkout --- */}
                <div className={styles.summary}>
                    <h2 style={{ marginBottom: '1rem' }}>Tóm tắt đơn hàng</h2>
                    
                    <div className={styles.summaryRow}>
                        <span>Tạm tính:</span>
                        <span>{formatPrice(cartData.grandTotal)}</span>
                    </div>

                    {/* Hiển thị số tiền tiết kiệm được nếu có */}
                    {cartData.baseGrandTotal > cartData.grandTotal && (
                        <div className={styles.summaryRow} style={{ color: '#28a745' }}>
                            <span>Tiết kiệm:</span>
                            <span>-{formatPrice(cartData.baseGrandTotal - cartData.grandTotal)}</span>
                        </div>
                    )}

                    <div className={styles.totalRow}>
                        <span>Tổng cộng:</span>
                        <span>{formatPrice(cartData.grandTotal)}</span>
                    </div>

                    <button className={styles.checkoutBtn} onClick={handleCheckout}>
                        Thanh toán ngay
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Sub-component cho từng dòng item để quản lý loading state riêng ---
interface CartItemRowProps {
    item: CartItem;
    onUpdate: (id: number, qty: number) => Promise<boolean>;
    onRemove: (id: number) => Promise<boolean>;
    formatPrice: (price: number) => string;
}

function CartItemRow({ item, onUpdate, onRemove, formatPrice }: CartItemRowProps) {
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleQuantityChange = async (delta: number) => {
        if (isUpdating) return;
        const newQty = item.quantity + delta;
        if (newQty < 1) return; // Nếu muốn xóa khi về 0, xử lý ở onRemove riêng cho an toàn

        setIsUpdating(true);
        await onUpdate(item.cartItemId, newQty);
        setIsUpdating(false);
    };

    const handleRemove = async () => {
        if (confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
            setIsUpdating(true);
            await onRemove(item.cartItemId);
            setIsUpdating(false);
        }
    };

    return (
        <div className={styles.itemRow}>
            {/* Ảnh sản phẩm */}
            <div className={styles.itemImage}>
                {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} />
                ) : (
                    <div style={{ background: '#eee', width: '100%', height: '100%' }} />
                )}
            </div>

            {/* Thông tin chính */}
            <div className={styles.itemInfo}>
                <Link href={`/${item.product.categorySlug}/${item.product.slug}`} className={styles.itemName}>
                    {item.product.name}
                </Link>
                <div className={styles.itemMeta}>
                    Đơn vị: {item.product.unit}
                </div>

                {/* --- NOTE HIỂN THỊ Ở ĐÂY --- */}
                {/* Đây là nơi logic Backend mapNote phát huy tác dụng */}
                {item.note && (
                    <div className={styles.itemNote}>
                        ⚠️ {item.note}
                    </div>
                )}

                <div className={styles.actions}>
                    <div className={styles.quantityControl}>
                        <button 
                            className={styles.qtyBtn} 
                            onClick={() => handleQuantityChange(-1)}
                            disabled={isUpdating || item.quantity <= 1}
                        >
                            -
                        </button>
                        <span className={styles.qtyValue}>
                            {isUpdating ? '...' : item.quantity}
                        </span>
                        <button 
                            className={styles.qtyBtn} 
                            onClick={() => handleQuantityChange(1)}
                            disabled={isUpdating}
                        >
                            +
                        </button>
                    </div>

                    <button className={styles.removeBtn} onClick={handleRemove} disabled={isUpdating}>
                        Xóa
                    </button>
                </div>
            </div>

            {/* Giá tiền */}
            <div className={styles.priceColumn}>
                <div className={styles.currentPrice}>
                    {formatPrice(item.totalItemPrice)}
                </div>
                {/* Nếu có giảm giá (itemPrice < basePrice) thì hiện giá gốc gạch ngang */}
                {item.basePrice > item.itemPrice && (
                    <div className={styles.oldPrice}>
                        {formatPrice(item.totalBasePrice)}
                    </div>
                )}
            </div>
        </div>
    );
}