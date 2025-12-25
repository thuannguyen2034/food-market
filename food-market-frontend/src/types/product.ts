// TypeScript interfaces matching backend DTOs

export interface ProductImage {
    id: number;
    imageUrl: string;
    displayOrder: number;
}

export interface CategorySummary {
    id: number;
    name: string;
    slug: string;
}

export interface TagDTO {
    id: number;
    name: string;
    slug: string;
}

export interface ProductResponse {
    id: number;
    name: string;
    description: string;
    specifications?: Record<string, string>; 
    images: ProductImage[];
    unit: string;
    basePrice: number;
    finalPrice: number;
    slug: string;
    stockQuantity: number;
    soldCount: number;
    category: CategorySummary;
    tags: TagDTO[];
    rating?: number; 
}

// Review interface
export interface ReviewResponse {
    id: number;
    userId: string;
    userName: string;
    productId: number;
    productName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface CategoryResponse {
    id: number;
    name: string;
    imageUrl: string;
    parentId: number | null;
    slug: string;
    children: CategoryResponse[];
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}
