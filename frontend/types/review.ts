export type Review = {
  id: number;
  product: number;              // id del producto
  user_name: string;            // nombre público del usuario
  rating: number;               // 1..5
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;           // ISO date
};