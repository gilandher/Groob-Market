export type CartItem = {
  product_id: number;
  name: string;
  sale_price: number;
  qty: number;

  // ✅ para WhatsApp y UI
  sku?: string;

  // ✅ para imágenes
  image_url?: string | null;
};

const STORAGE_KEY = "groob_cart_v1";

function safeParse(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1): CartItem[] {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.product_id === item.product_id);

  if (idx >= 0) {
    cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty };
  } else {
    cart.push({ ...item, qty });
  }

  saveCart(cart);
  return cart; // ✅ ahora devuelve el carrito
}

export function updateQty(product_id: number, qty: number): CartItem[] {
  const cart = getCart();
  const next = cart
    .map((it) => (it.product_id === product_id ? { ...it, qty } : it))
    .filter((it) => it.qty > 0);

  saveCart(next);
  return next; // ✅ ahora devuelve el carrito
}

export function removeFromCart(product_id: number): CartItem[] {
  const cart = getCart();
  const next = cart.filter((it) => it.product_id !== product_id);

  saveCart(next);
  return next; // ✅ ahora devuelve el carrito
}