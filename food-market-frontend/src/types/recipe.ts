import { ProductResponse } from './product';

export interface RecipeResponse {
    id: number;
    name: string;
    imageUrl: string;
    cookingSteps: string;
    ingredients: string;
    tags: string; // Chuỗi "TAG1,TAG2"
    productIds: number[];
    matchScore?: number; // Dùng cho trang Search (Scoring)
}
export interface RecipeDetailDTO {
    recipeInfo: RecipeResponse;
    products: ProductResponse[];
}
export interface RecipeSearchRequest {
    keyword?: string;
    role?: string;
    isVegan?: boolean;
    allergies?: string[];
    preferredFlavors?: string[];
    timeConstraint?: string;
    nutritionGoals?: string[];
    page: number;
    size: number;
}