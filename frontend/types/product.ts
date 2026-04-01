export type Category = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
};

export type Pricing = {
  original_price: number;
  final_price: number;
  discount_percent: number;
  floor_price: number;
  margin_percent: number;
  strategy: string;
  label: string;
  badge_color: string;
  countdown_seconds: number | null;
  savings_cop: number;
  has_discount: boolean;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: Category;
  sale_price: number;
  stock_qty: number;
  is_active: boolean;
  image_url?: string | null;
  pricing?: Pricing | null;
};