// src/types/home.ts
import { ProductResponse } from '@/types/product';

export interface HomeSection {
    categoryId: number;
    categoryName: string;
    categorySlug: string;
    products: ProductResponse[];
}

export interface HomePageData {
    flashSaleProducts: ProductResponse[];
    categorySections: HomeSection[];
}