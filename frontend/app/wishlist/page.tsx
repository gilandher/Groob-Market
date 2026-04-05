"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getWishlist, removeFromWishlist, WishlistItem } from "../../lib/wishlist";
import { addToCart } from "../../lib/cart";

function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setItems(getWishlist());
    const sync = () => setItems(getWishlist());
    window.addEventListener("groob_wishlist_update", sync);
    return () => window.removeEventListener("groob_wishlist_update", sync);
  }, []);

  function handleRemove(id: number) {
    removeFromWishlist(id);
  }

  function handleAddToCart(item: WishlistItem) {
    addToCart({
      product_id: item.product_id,
      name: item.name,
      sale_price: item.sale_price,
      sku: "",
      image_url: item.image_url,
    });
    window.dispatchEvent(new Event("groob_cart_update"));
    setAdded(a => ({ ...a, [item.product_id]: true }));
    setTimeout(() => setAdded(a => ({ ...a, [item.product_id]: false })), 2000);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>

        <Link href="/" style={{ color: "var(--groob-purple)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          ← Volver a la tienda
        </Link>

        {/* Header */}
        <div style={{ margin: "20px 0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>❤️</span> Lista de Deseos
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {items.length} producto{items.length !== 1 ? "s" : ""} guardado{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          {items.length > 0 && (
            <Link href="/cart" className="btn-primary" style={{ textDecoration: "none", padding: "10px 20px", fontSize: 13 }}>
              🛒 Ir al carrito
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "64px 20px",
            background: "#fff", borderRadius: 24,
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>💔</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: "#0f172a" }}>Tu lista de deseos está vacía</h2>
            <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
              Explora nuestra tienda y guarda los productos que te gusten tocando el ❤️
            </p>
            <Link href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 24, padding: "13px 32px", textDecoration: "none" }}>
              ✨ Explorar productos
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {items.map(item => (
              <div
                key={item.product_id}
                style={{
                  background: "#fff", borderRadius: 20,
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(108,77,255,0.15)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)";
                }}
              >
                {/* Remove button */}
                <div style={{ position: "relative" }}>
                  <Link href={`/product/${item.product_id}`} style={{ textDecoration: "none" }}>
                    <div style={{ height: 180, overflow: "hidden", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 16 }} />
                      ) : (
                        <span style={{ fontSize: 64 }}>📦</span>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    title="Quitar de deseos"
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 34, height: 34, borderRadius: "50%",
                      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
                      border: "none", cursor: "pointer", fontSize: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.92)")}
                  >
                    💔
                  </button>
                </div>

                <div style={{ padding: "14px 16px 16px" }}>
                  {item.category && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#6c4dff",
                      background: "#f5f3ff", padding: "2px 8px", borderRadius: 10,
                      display: "inline-block", marginBottom: 8,
                    }}>
                      {item.category}
                    </span>
                  )}
                  <Link href={`/product/${item.product_id}`} style={{ textDecoration: "none" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", lineHeight: 1.4, marginBottom: 8 }}>
                      {item.name}
                    </p>
                  </Link>
                  <p style={{ fontWeight: 900, fontSize: 20, color: "#0f172a", marginBottom: 12 }}>
                    {formatCOP(item.sale_price)}
                  </p>
                  <button
                    onClick={() => handleAddToCart(item)}
                    style={{
                      width: "100%", padding: "10px",
                      background: added[item.product_id]
                        ? "linear-gradient(135deg, #22c55e, #16a34a)"
                        : "linear-gradient(135deg, #6c4dff, #9b8cff)",
                      border: "none", borderRadius: 10, color: "#fff",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {added[item.product_id] ? "✓ ¡Agregado!" : "🛒 Añadir al carrito"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
