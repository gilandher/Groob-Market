// ─── Groob Market — Wishlist (localStorage) ─────────────────────────────────
// Guarda los productos favoritos del cliente localmente.

export interface WishlistItem {
  product_id: number;
  name: string;
  sale_price: number;
  image_url: string | null;
  category?: string;
}

const KEY = "groob_wishlist";

export function getWishlist(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function isInWishlist(productId: number): boolean {
  return getWishlist().some((i) => i.product_id === productId);
}

export function toggleWishlist(item: WishlistItem): boolean {
  const list = getWishlist();
  const idx = list.findIndex((i) => i.product_id === item.product_id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("groob_wishlist_update"));
    return false; // removed
  } else {
    list.push(item);
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("groob_wishlist_update"));
    return true; // added
  }
}

export function removeFromWishlist(productId: number): void {
  const list = getWishlist().filter((i) => i.product_id !== productId);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("groob_wishlist_update"));
}

export function clearWishlist(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("groob_wishlist_update"));
}
