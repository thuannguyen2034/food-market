import { ProductResponse } from './product';

export interface RecipeResponse {
    id: number;
    name: string;
    imageUrl: string;
    cookingSteps: string;
    ingredients: string;
    tags: string; 
    productIds: number[];
    matchScore?: number; 
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