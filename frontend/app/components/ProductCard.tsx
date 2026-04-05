"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart } from "@/lib/cart";
import { toggleWishlist, isInWishlist } from "@/lib/wishlist";
import type { Product, Pricing } from "@/types/product";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function StarsRow({ rating = 4.5, count }: { rating?: number; count?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div className="stars" style={{ fontSize: 12 }}>
        {Array.from({ length: 5 }, (_, i) => {
          if (i < full) return <span key={i}>★</span>;
          if (i === full && half) return <span key={i} style={{ opacity: 0.5 }}>★</span>;
          return <span key={i} style={{ color: "#d1d5db" }}>★</span>;
        })}
      </div>
      {count && (
        <span style={{ fontSize: 11, color: "#94a3b8" }}>({count})</span>
      )}
    </div>
  );
}

/* ─── Countdown Timer ─────────────────────────────────────────── */
function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [left]);

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  function pad(n: number) { return String(n).padStart(2, "0"); }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, color: "#ef4444",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      {h > 0 && <>{pad(h)}:</>}{pad(m)}:{pad(s)}
    </div>
  );
}

/* ─── Discount Badge ──────────────────────────────────────────── */
function DiscountBadge({ pricing }: { pricing: Pricing }) {
  if (!pricing.has_discount) return null;
  return (
    <div style={{
      position: "absolute", top: 10, right: 10, zIndex: 2,
      background: pricing.badge_color || "#ef4444",
      color: "#fff", borderRadius: "20px",
      padding: "3px 10px", fontSize: 12, fontWeight: 800,
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    }}>
      -{Math.round(pricing.discount_percent)}%
    </div>
  );
}

/* ─── ProductCard ─────────────────────────────────────────────── */
export function ProductCard({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const pricing = product.pricing;
  const displayPrice = pricing?.has_discount ? pricing.final_price : product.sale_price;
  const originalPrice = pricing?.has_discount ? pricing.original_price : null;

  useEffect(() => {
    setWished(isInWishlist(product.id));
    const sync = () => setWished(isInWishlist(product.id));
    window.addEventListener("groob_wishlist_update", sync);
    return () => window.removeEventListener("groob_wishlist_update", sync);
  }, [product.id]);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addToCart({
      product_id: product.id,
      name: product.name,
      sale_price: displayPrice,
      sku: product.sku,
      image_url: product.image_url ?? null,
    });
    window.dispatchEvent(new Event("groob_cart_update"));
    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 600);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const nowWished = toggleWishlist({
      product_id: product.id,
      name: product.name,
      sale_price: displayPrice,
      image_url: product.image_url ?? null,
      category: product.category?.name,
    });
    setWished(nowWished);
  }

  return (
    <Link href={`/product/${product.id}`} className="product-card" style={{ textDecoration: "none" }}>

      {/* Image area */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-card-img"
          />
        ) : (
          <div className="product-card-img" style={{
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
            background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
          }}>
            📦
          </div>
        )}

        {/* Category pill */}
        <span style={{
          position: "absolute", top: 10, left: 10, zIndex: 2,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
          color: "#6c4dff", padding: "3px 10px", borderRadius: 20,
          fontSize: 10, fontWeight: 700,
        }}>
          {product.category?.name || "Tech"}
        </span>

        {/* ❤️ Wishlist button — esquina inferior derecha para no tapar el descuento */}
        <button
          onClick={handleWishlist}
          title={wished ? "Quitar de favoritos" : "Guardar en favoritos"}
          style={{
            position: "absolute", bottom: 8, right: 8, zIndex: 3,
            width: 30, height: 30, borderRadius: "50%",
            background: wished ? "rgba(254,242,242,0.95)" : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
            border: `1.5px solid ${wished ? "#fecaca" : "rgba(0,0,0,0.08)"}`,
            cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
          }}
        >
          {wished ? "❤️" : "🤍"}
        </button>

        {/* Discount badge */}
        {pricing && <DiscountBadge pricing={pricing} />}

        {/* Low stock warning */}
        {product.stock_qty > 0 && product.stock_qty <= 5 && (
          <div style={{
            position: "absolute", bottom: 8, left: 10, right: 10, zIndex: 2,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "3px 8px", textAlign: "center",
            fontSize: 11, fontWeight: 700, color: "#ef4444",
          }}>
            ⚡ ¡Solo {product.stock_qty} disponibles!
          </div>
        )}
      </div>

      {/* Body */}
      <div className="product-card-body">
        <span className="product-card-name">{product.name}</span>

        <StarsRow rating={4.5} count={(product.id * 17 + 43) % 200 + 20} />

        {/* Price section */}
        <div style={{ marginTop: 4 }}>
          {originalPrice && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{
                fontSize: 12, color: "#94a3b8", textDecoration: "line-through",
              }}>
                {formatCOP(originalPrice)}
              </span>
              {pricing?.savings_cop && pricing.savings_cop > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#059669",
                  background: "#d1fae5", padding: "1px 6px", borderRadius: 10,
                }}>
                  Ahorras {formatCOP(pricing.savings_cop)}
                </span>
              )}
            </div>
          )}
          <p className="product-card-price">{formatCOP(displayPrice)}</p>
        </div>

        {/* Strategy label + countdown */}
        {pricing?.has_discount && pricing.label && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: pricing.badge_color || "#6c4dff",
            }}>
              {pricing.label}
            </span>
            {pricing.countdown_seconds && pricing.countdown_seconds > 0 && (
              <Countdown seconds={pricing.countdown_seconds} />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="product-card-footer">
        <button
          className="btn-primary"
          style={{
            flex: 1, padding: "9px 12px", fontSize: 13,
            background: added
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : undefined,
          }}
          onClick={handleAdd}
          id={`btn-add-${product.id}`}
          disabled={adding || product.stock_qty === 0}
        >
          {added ? (
            <>✓ ¡Agregado!</>
          ) : product.stock_qty === 0 ? (
            "Sin stock"
          ) : adding ? (
            <span style={{
              width: 14, height: 14,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid white", borderRadius: "50%",
              display: "inline-block", animation: "spin 0.8s linear infinite",
            }} />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              Comprar
            </>
          )}
        </button>
      </div>
    </Link>
  );
}

/* ─── ProductListItem ─────────────────────────────────────────── */
export function ProductListItem({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);
  const pricing = product.pricing;
  const displayPrice = pricing?.has_discount ? pricing.final_price : product.sale_price;
  const originalPrice = pricing?.has_discount ? pricing.original_price : null;

  const waText = encodeURIComponent(
    `Hola Groob Market 👋, quiero: ${product.name} (SKU: ${product.sku}). Precio: ${formatCOP(displayPrice)}`
  );

  function handleAdd() {
    setAdding(true);
    addToCart({
      product_id: product.id,
      name: product.name,
      sale_price: displayPrice,
      sku: product.sku,
      image_url: product.image_url ?? null,
    });
    window.dispatchEvent(new Event("groob_cart_update"));
    setTimeout(() => setAdding(false), 1200);
  }

  return (
    <div className="product-list-item">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="product-list-img" />
      ) : (
        <div className="product-list-img" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        }}>
          📦
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{product.name}</p>
        <StarsRow rating={4.5} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{formatCOP(displayPrice)}</p>
          {originalPrice && (
            <span style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>
              {formatCOP(originalPrice)}
            </span>
          )}
          {pricing?.has_discount && pricing.label && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: pricing.badge_color,
              background: `${pricing.badge_color}18`,
              padding: "2px 7px", borderRadius: 10,
            }}>
              {pricing.label}
            </span>
          )}
        </div>
        {product.stock_qty <= 5 && product.stock_qty > 0 && (
          <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginTop: 2 }}>
            ⚡ ¡Solo {product.stock_qty} disponibles!
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          className="btn-primary btn-sm"
          onClick={handleAdd}
          disabled={adding || product.stock_qty === 0}
          id={`btn-list-add-${product.id}`}
        >
          {adding ? "✓" : "Añadir"}
        </button>
        <a
          href={`https://wa.me/573011963515?text=${waText}`}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp btn-sm"
          style={{ textAlign: "center" }}
        >
          💬
        </a>
      </div>
    </div>
  );
}
