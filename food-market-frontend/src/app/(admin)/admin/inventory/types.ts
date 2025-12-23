// TypeScript types matching backend DTOs

export type InventoryBatchDTO = {
    batchId: number;
    productId: number;
    productName?: string; // Added for display
    batchCode: string;
    quantityReceived: number;
    currentQuantity: number;
    entryDate: string; // OffsetDateTime from backend
    expirationDate: string; // LocalDate from backend
    adjustments?: InventoryAdjustmentDTO[];
};

export type ImportStockRequestDTO = {
    productId: number;
    batchCode?: string;
    expirationDate: string; // LocalDate format: YYYY-MM-DD
    quantityReceived: number;
};

export type AdjustStockRequestDTO = {
    batchId: number;
    adjustedByUserId?: string;
    adjustmentQuantity: number; // Negative to subtract, positive to add
    reason: string;
};

export type InventoryAdjustmentDTO = {
    adjustmentId: number;
    batchId: number;
    adjustedByUserId: string;
    adjustedByUserName: string;
    adjustmentQuantity: number;
    reason: string;
    adjustmentDate: string; // OffsetDateTime from backend
};

export type InventoryDestroyRequestDTO = {
    reason: string;
};

export type PageResponse<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // 0-based page index
    size: number;
    first: boolean;
    last: boolean;
};

export type InventoryStats = {
    totalBatches: number;
    expiringSoon: number;
    totalValue: number;
    lowStock: number;
};

// Adjustment reason options
export const ADJUSTMENT_REASONS = [
    { value: 'HONG_VO', label: 'Hư hỏng' },
    { value: 'HET_HAN', label: 'Hết hạn' },
    { value: 'KIEM_KHO', label: 'Kiểm kho' },
    { value: 'MAT_MAT', label: 'Mất mát' },
    { value: 'SAI_SOT', label: 'Sai sót nhập liệu' },
    { value: 'KHAC', label: 'Lý do khác' },
];

// Destroy reason options
export const DESTROY_REASONS = [
    { value: 'HET_HAN', label: 'Hết hạn sử dụng' },
    { value: 'HU_HONG', label: 'Hư hỏng' },
    { value: 'LOI_SAN_XUAT', label: 'Lỗi sản xuất' },
    { value: 'KHONG_DAT_CHUAN', label: 'Không đạt chuẩn' },
    { value: 'KHAC', label: 'Lý do khác' },
];
