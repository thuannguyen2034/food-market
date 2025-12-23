// src/app/type/Order.ts

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
    COD = 'COD',
    VNPay = 'VNPAY'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
}

export type OrderItemDTO = {
    id: number;
    quantity: number;
    productIdSnapshot: number;
    productNameSnapshot: string;
    productThumbnailSnapshot: string;
    priceAtPurchase: number;
    basePriceAtPurchase: number;
    productSlug: string;
    categorySlug: string;
    batchCode: string;
    isReviewed: boolean;
};

export type OrderDTO = {
    orderId: string;
    status: OrderStatus;
    totalAmount: number;
    deliveryAddress: string;
    deliveryPhone: string;
    deliveryDate: string;
    createdAt: string;
    deliveryTimeSlot: string;
    note?: string;
    items: OrderItemDTO[];
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentDate?: string;
};

export type OrderFilter = {
    keyword?: string;
    dateFrom?: string;
    dateTo?: string;
    statuses?: OrderStatus[];
    productIds?: number[];
    userId?: string;
};

export type OrderListStats = {
    totalToday: number;
    pendingCount: number;
    deliveredToday: number;
    cancelledTotal: number;
};

// Helper function to get status label in Vietnamese
export const getOrderStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
        [OrderStatus.PENDING]: 'Chờ xử lý',
        [OrderStatus.CONFIRMED]: 'Đã xác nhận',
        [OrderStatus.PROCESSING]: 'Đang đóng gói',
        [OrderStatus.OUT_FOR_DELIVERY]: 'Đang giao',
        [OrderStatus.DELIVERED]: 'Đã giao',
        [OrderStatus.CANCELLED]: 'Đã hủy'
    };
    return labels[status];
};

// Helper to get valid next statuses for status update
export const getValidNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [], 
        [OrderStatus.CANCELLED]: [] 
    };
    return transitions[currentStatus] || [];
};
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page index
}