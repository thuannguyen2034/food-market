interface CategorySummary  { id: number; name: string };
interface Tag  { id: number; name: string };
export interface ProductResponseDTO {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  unit: string;
  basePrice: number;
  category: CategorySummary;
  tags: Tag[];
};