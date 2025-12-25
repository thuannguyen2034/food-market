// src/types/cart.ts

export interface CartItemProductInfo {
    id: number;
    name: string;
    imageUrl: string | null;
    unit: string;
    slug: string;
    categorySlug: string;
}

export interface CartItem {
    cartItemId: number;
    quantity: number;
    basePrice: number;       
    itemPrice: number;       
    totalBasePrice: number;
    totalItemPrice: number;
    product: CartItemProductInfo; 
    note?: string;           
}

export interface CartResponse {
    cartId: string; 
    items: CartItem[];
    grandTotal: number;
    baseGrandTotal: number;
}

export type CartMap = Record<number, { 
    cartItemId: number; 
    quantity: number; 
    note?: string; 
}>;