"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReviewsList from "./ReviewsList";
import ReviewForm from "./ReviewForm";
import { addToCart } from "../../../lib/cart";
import { toggleWishlist, isInWishlist } from "../../../lib/wishlist";

type Category = { id: number; name: string; slug: string; is_visible: boolean };
type Product = {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: Category;
  sale_price: number;
  stock_qty: number;
  is_active: boolean;
  image_url?: string | null;
  pricing?: { has_discount: boolean; final_price: number; original_price: number; discount_percent: number };
};

type RelatedProduct = { id: number; name: string; sale_price: number; image_url?: string | null; category?: { name: string } };

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ fontSize: 18, color: i < Math.round(rating) ? "#f59e0b" : "#d1d5db" }}>★</span>
        ))}
      </div>
      {count !== undefined && (
        <span style={{ fontSize: 13, color: "#64748b" }}>({count} reseñas)</span>
      )}
    </div>
  );
}

/* ─── Zoom Image Component ────────────────────────────────────────────────── */
function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPos({ x, y });
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={handleMouseMove}
      style={{
        overflow: "hidden", cursor: zoom ? "zoom-in" : "default",
        borderRadius: 16, width: "100%", height: 340,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f8fafc", position: "relative",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxHeight: "100%", maxWidth: "100%", objectFit: "contain",
          transition: "transform 0.15s ease",
          transform: zoom ? "scale(2.2)" : "scale(1)",
          transformOrigin: `${pos.x}% ${pos.y}%`,
          pointerEvents: "none",
        }}
      />
      {zoom && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(0,0,0,0.5)", color: "#fff",
          fontSize: 10, fontWeight: 700, padding: "3px 8px",
          borderRadius: 8, pointerEvents: "none",
        }}>
          🔍 Zoom activo
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "";
  const productId = Number.parseInt(rawId, 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [wished, setWished] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewAvg, setReviewAvg] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

  useEffect(() => {
    if (!Number.isFinite(productId)) { setError("ID inválido"); return; }
    fetch(`${apiBase}/products/${productId}/`, { cache: "no-store" })
      .then(res => { if (!res.ok) throw new Error(`Error ${res.status}`); return res.json(); })
      .then(data => {
        setProduct(data as Product);
        setWished(isInWishlist(productId));
        // Fetch related products from same category
        fetch(`${apiBase}/products/?cat=${data.category?.slug || ""}&limit=8`)
          .then(r => r.json())
          .then(d => {
            const list = (d.results ?? d) as RelatedProduct[];
            setRelated(list.filter((p: RelatedProduct) => p.id !== productId).slice(0, 4));
          }).catch(() => {});
      })
      .catch(e => setError(e?.message || "Error cargando producto"));
  }, [productId, rawId]);

  // Sync wishlist
  useEffect(() => {
    const sync = () => setWished(isInWishlist(productId));
    window.addEventListener("groob_wishlist_update", sync);
    return () => window.removeEventListener("groob_wishlist_update", sync);
  }, [productId]);

  function handleAdd() {
    if (!product) return;
    setAdding(true);
    const price = product.pricing?.has_discount ? product.pricing.final_price : product.sale_price;
    addToCart({
      product_id: product.id,
      name: product.name,
      sale_price: price,
      sku: product.sku,
      image_url: product.image_url ?? null,
    });
    window.dispatchEvent(new Event("groob_cart_update"));
    setTimeout(() => setAdding(false), 1200);
  }

  function handleWishlist() {
    if (!product) return;
    const price = product.pricing?.has_discount ? product.pricing.final_price : product.sale_price;
    const added = toggleWishlist({
      product_id: product.id,
      name: product.name,
      sale_price: price,
      image_url: product.image_url ?? null,
      category: product.category?.name,
    });
    setWished(added);
  }

  if (error || !product) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
          <Link href="/" style={{ color: "var(--groob-purple)", fontSize: 14, textDecoration: "none" }}>← Volver a la tienda</Link>
          {error ? (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <div style={{ fontSize: 56 }}>😕</div>
              <h1 style={{ marginTop: 16, fontSize: 22 }}>Producto no encontrado</h1>
              <p style={{ color: "var(--groob-text-muted)", marginTop: 8 }}>{error}</p>
            </div>
          ) : (
            <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div className="skeleton" style={{ height: 340, borderRadius: 20 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="skeleton" style={{ height: 28, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 20, width: "60%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 36, width: "40%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  const displayPrice = product.pricing?.has_discount ? product.pricing.final_price : product.sale_price;
  const originalPrice = product.pricing?.has_discount ? product.pricing.original_price : null;
  const discountPct = product.pricing?.has_discount ? product.pricing.discount_percent : 0;

  const waText = encodeURIComponent(
    `Hola Groob Market 👋, quiero el producto: ${product.name}. Precio: ${formatCOP(displayPrice)}`
  );
  const inStock = product.stock_qty > 0;

  // Dummy images array (real images would come from API with gallery support)
  const images = [product.image_url].filter(Boolean) as string[];

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 20px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 24, color: "#94a3b8" }}>
          <Link href="/" style={{ color: "#6c4dff", textDecoration: "none", fontWeight: 600 }}>Inicio</Link>
          <span>›</span>
          <span>{product.category?.name || "Productos"}</span>
          <span>›</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>{product.name}</span>
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

          {/* Image Column */}
          <div>
            {/* Main image with zoom */}
            <div style={{
              background: "#fff", borderRadius: 20,
              border: "1px solid var(--groob-border)",
              boxShadow: "var(--groob-shadow)",
              padding: 20, overflow: "hidden",
            }}>
              {images.length > 0 ? (
                <ZoomImage src={images[activeImg] || ""} alt={product.name} />
              ) : (
                <div style={{
                  height: 340, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 80, opacity: 0.3,
                }}>📦</div>
              )}
            </div>

            {/* Thumbnail strip (if multiple images) */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 72, height: 72, flexShrink: 0, borderRadius: 12, padding: 4,
                      border: `2px solid ${activeImg === i ? "#6c4dff" : "#e2e8f0"}`,
                      background: "#fff", cursor: "pointer", overflow: "hidden",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Zoom hint */}
            <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
              🔍 Pasa el cursor sobre la imagen para hacer zoom
            </p>
          </div>

          {/* Info Column */}
          <div>
            {/* Category badge (NO SKU visible al cliente) */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span className="badge badge-purple">{product.category?.name || "Sin categoría"}</span>
              {!inStock && (
                <span style={{ background: "#fef2f2", color: "#dc2626", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  Sin stock
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.25, marginBottom: 12, color: "#0f172a" }}>
              {product.name}
            </h1>

            <StarRating rating={reviewAvg || 4.5} count={reviewCount || undefined} />

            {/* Price */}
            <div style={{
              margin: "20px 0",
              padding: "18px 20px",
              background: "linear-gradient(135deg, #f5f3ff, #fff)",
              borderRadius: 16,
              border: "1px solid rgba(108,77,255,0.15)",
            }}>
              {originalPrice && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>
                    {formatCOP(originalPrice)}
                  </span>
                  {discountPct > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#ef4444", padding: "2px 8px", borderRadius: 10 }}>
                      -{Math.round(discountPct)}%
                    </span>
                  )}
                </div>
              )}
              <p style={{ fontSize: 34, fontWeight: 900, color: "#0f172a" }}>
                {formatCOP(displayPrice)}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>+ Domicilio según zona</p>
            </div>

            {/* Stock indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: inStock ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: inStock ? "#15803d" : "#dc2626", fontWeight: 600 }}>
                {inStock ? `Disponible (${product.stock_qty} en stock)` : "Sin stock"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, marginBottom: 24 }}>
                {product.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn-primary animate-pulse-glow"
                  onClick={handleAdd}
                  disabled={adding || !inStock}
                  id="btn-add-cart"
                  style={{ flex: 1, fontSize: 16, padding: "14px" }}
                >
                  {adding ? "✓ ¡Agregado!" : <><span>🛒</span> Añadir al carrito</>}
                </button>

                {/* Wishlist button */}
                <button
                  onClick={handleWishlist}
                  title={wished ? "Quitar de favoritos" : "Guardar en favoritos"}
                  style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: wished ? "#fef2f2" : "#f8fafc",
                    border: `1.5px solid ${wished ? "#fecaca" : "#e2e8f0"}`,
                    fontSize: 24, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {wished ? "❤️" : "🤍"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href={`https://wa.me/573011963515?text=${waText}`}
                  target="_blank" rel="noreferrer"
                  className="btn-whatsapp"
                  id="btn-whatsapp-product"
                  style={{ flex: 1, fontSize: 14 }}
                >
                  💬 Pedir por WhatsApp
                </a>
                <Link href="/cart" className="btn-outline" id="btn-view-cart" style={{ flex: 1, fontSize: 14 }}>
                  Ver carrito
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              {[
                { icon: "🚀", text: "Entrega mismo día" },
                { icon: "✅", text: "Pago contraentrega" },
                { icon: "🔒", text: "Compra segura" },
                { icon: "🔧", text: "Garantía incluida" },
              ].map((t) => (
                <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                  <span>{t.icon}</span><span>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── REVIEWS SECTION ── */}
        <div style={{ marginTop: 56, background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>⭐ Opiniones del producto</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>
            Reseñas verificadas de clientes que lo compraron. Solo una reseña por usuario.
          </p>
          <ReviewsList
            productId={product.id}
            reloadKey={reloadKey}
            onStatsUpdate={(avg, count) => { setReviewAvg(avg); setReviewCount(count); }}
          />
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
            <ReviewForm productId={product.id} onCreated={() => setReloadKey(v => v + 1)} />
          </div>
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>También te puede interesar</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Productos relacionados que otros clientes también compraron</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {related.map(rp => (
                <Link key={rp.id} href={`/product/${rp.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff", borderRadius: 16, overflow: "hidden",
                    border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 28px rgba(108,77,255,0.12)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    }}
                  >
                    <div style={{ height: 140, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {rp.image_url ? (
                        <img src={rp.image_url} alt={rp.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 12 }} />
                      ) : (
                        <span style={{ fontSize: 48 }}>📦</span>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, marginBottom: 6 }}>{rp.name}</p>
                      <p style={{ fontWeight: 900, fontSize: 16, color: "#6c4dff" }}>{formatCOP(rp.sale_price)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}