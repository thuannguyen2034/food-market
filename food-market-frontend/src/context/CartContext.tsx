'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { CartResponse, CartMap } from '@/types/cart';
import toast from 'react-hot-toast';

interface CartContextType {
    cartData: CartResponse | null;
    cartMap: CartMap; // Dùng để ProductCard tra cứu nhanh
    totalItems: number; // Số hiển thị trên Navbar badge
    isLoadingCart: boolean;
    fetchCart: () => Promise<void>;
    addToCart: (productId: number, quantity: number) => Promise<boolean>;
    updateCartItem: (cartItemId: number, quantity: number) => Promise<boolean>;
    removeCartItem: (cartItemId: number) => Promise<boolean>;
    clearCartLocal: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, authedFetch } = useAuth();
    const [cartData, setCartData] = useState<CartResponse | null>(null);
    const [cartMap, setCartMap] = useState<CartMap>({});
    const [isLoadingCart, setIsLoadingCart] = useState(false);
    
    // Hàm tiện ích: Xử lý dữ liệu trả về từ API
    const processCartResponse = (data: CartResponse) => {
        setCartData(data);
        const newMap: CartMap = {};
        // Tạo Map: ProductId -> { cartItemId, quantity }
        data.items.forEach(item => {
        newMap[item.product.id] = {
            cartItemId: item.cartItemId,
            quantity: item.quantity,
            note: item.note // Vẫn lưu note vào map để dùng nếu cần
        };

    });
        setCartMap(newMap);
    };

    const fetchCart = useCallback(async () => {
        if (!user) {
            setCartData(null);
            setCartMap({});
            return;
        }

        try {
            setIsLoadingCart(true);
            const res = await authedFetch('/api/v1/cart'); // Backend endpoint
            if (res.ok) {
                const data: CartResponse = await res.json();
                processCartResponse(data);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoadingCart(false);
        }
    }, [user, authedFetch]);

    // Tự động fetch khi user đăng nhập
    useEffect(() => {
        if(user?.role === 'ADMIN') return;
        fetchCart();
    }, [fetchCart, user]);

    // 1. Add to Cart
    const addToCart = async (productId: number, quantity: number) => {
        if (!user) return false;
        try {
            const res = await authedFetch('/api/v1/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity }),
            });
            
            if (res.ok) {
                const updatedCart: CartResponse = await res.json();
                processCartResponse(updatedCart); // Update state ngay lập tức
                toast.success('Đã thêm vào giỏ hàng');
                return true;
            } else {
                const err = await res.json();
                toast.error(err.message || 'Không thể thêm vào giỏ');
                return false;
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
            return false;
        }
    };

    // 2. Update Cart Item
    const updateCartItem = async (cartItemId: number, quantity: number) => {
        try {
            // Nếu quantity = 0 -> Gọi xóa
            if (quantity <= 0) {
                return removeCartItem(cartItemId);
            }

            const res = await authedFetch(`/api/v1/cart/items/${cartItemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity }),
            });

            if (res.ok) {
                const updatedCart: CartResponse = await res.json();
                processCartResponse(updatedCart);
                return true;
            } else {
                const err = await res.json();
                toast.error(err.message || 'Lỗi cập nhật');
                // Nếu lỗi, fetch lại để sync số lượng cũ về đúng thực tế
                fetchCart(); 
                return false;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    // 3. Remove Item
    const removeCartItem = async (cartItemId: number) => {
        try {
            const res = await authedFetch(`/api/v1/cart/items/${cartItemId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const updatedCart: CartResponse = await res.json();
                processCartResponse(updatedCart);
                toast.success('Đã xóa sản phẩm');
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };
    const clearCartLocal = () => {
        setCartData(null);
        setCartMap({});
    };
    // Tính tổng số lượng item để hiện Badge (Navbar)
    const totalItems = Object.values(cartMap).reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartData,
            cartMap,
            totalItems,
            isLoadingCart,
            fetchCart,
            addToCart,
            updateCartItem,
            removeCartItem,
            clearCartLocal
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};