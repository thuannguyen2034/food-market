export interface CreateReviewRequest {
  productId: number;
  orderId: string;
  rating: number;
  comment: string;
}