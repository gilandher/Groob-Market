"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReviewsList from "./ReviewsList";
import ReviewForm from "./ReviewForm";
import { addToCart } from "../../../lib/cart";

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
};

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="stars" style={{ fontSize: "18px" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < count ? "var(--groob-star)" : "#d1d5db" }}>★</span>
      ))}
      <span style={{ fontSize: "13px", color: "var(--groob-text-muted)", marginLeft: 6 }}>
        (4.5 · 23 reseñas)
      </span>
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "";
  const productId = Number.parseInt(rawId, 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(productId)) { setError(`ID inválido`); return; }
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
    fetch(`${apiBase}/products/${productId}/`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => setProduct(data as Product))
      .catch((e) => setError(e?.message || "Error cargando producto"));
  }, [productId, rawId]);

  function handleAdd() {
    if (!product) return;
    setAdding(true);
    addToCart({
      product_id: product.id,
      name: product.name,
      sale_price: product.sale_price,
      sku: product.sku,
      image_url: product.image_url ?? null,
    });
    window.dispatchEvent(new Event("groob_cart_update"));
    setTimeout(() => setAdding(false), 1200);
  }

  if (error || !product) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
          <Link href="/" style={{ color: "var(--groob-purple)", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            ← Volver a la tienda
          </Link>
          {error ? (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <div style={{ fontSize: 56 }}>😕</div>
              <h1 style={{ marginTop: 16, fontSize: "22px" }}>Producto no encontrado</h1>
              <p style={{ color: "var(--groob-text-muted)", marginTop: 8 }}>{error}</p>
            </div>
          ) : (
            <div style={{ marginTop: 40 }}>
              {/* Skeleton */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div className="skeleton" style={{ height: 340, borderRadius: 20 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="skeleton" style={{ height: 28, borderRadius: 8 }} />
                  <div className="skeleton" style={{ height: 20, width: "60%", borderRadius: 8 }} />
                  <div className="skeleton" style={{ height: 36, width: "40%", borderRadius: 8 }} />
                  <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  const waText = encodeURIComponent(
    `Hola Groob Market 👋, quiero el producto: ${product.name} (SKU: ${product.sku}). Precio: ${formatCOP(product.sale_price)}`
  );

  const inStock = product.stock_qty > 0;

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 20px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", marginBottom: 24, color: "var(--groob-text-muted)" }}>
          <Link href="/" style={{ color: "var(--groob-purple)", textDecoration: "none" }}>Inicio</Link>
          <span>›</span>
          <span>{product.category?.name || "Productos"}</span>
          <span>›</span>
          <span style={{ color: "var(--groob-text)", fontWeight: 600 }}>{product.name}</span>
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

          {/* Image Column */}
          <div>
            <div style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid var(--groob-border)",
              overflow: "hidden",
              boxShadow: "var(--groob-shadow)",
              padding: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 320,
            }}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ maxHeight: 300, maxWidth: "100%", objectFit: "contain", transition: "transform 0.3s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              ) : (
                <div style={{ fontSize: 80, opacity: 0.3 }}>📦</div>
              )}
            </div>
          </div>

          {/* Info Column */}
          <div>
            {/* Category + SKU */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="badge badge-purple">{product.category?.name || "Sin categoría"}</span>
              <span className="badge" style={{ background: "#f3f4f6", color: "var(--groob-text-muted)" }}>
                SKU: {product.sku}
              </span>
            </div>

            <h1 style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
              {product.name}
            </h1>

            <Stars />

            {/* Price */}
            <div style={{
              margin: "20px 0",
              padding: "16px 20px",
              background: "linear-gradient(135deg, var(--groob-purple-bg), #ffffff)",
              borderRadius: 14,
              border: "1px solid rgba(108,77,255,0.15)",
            }}>
              <p style={{ fontSize: "32px", fontWeight: 900, color: "var(--groob-text)" }}>
                {formatCOP(product.sale_price)}
              </p>
              <p style={{ fontSize: "13px", color: "var(--groob-text-muted)", marginTop: 4 }}>
                + Domicilio según zona
              </p>
            </div>

            {/* Stock */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: inStock ? "var(--groob-success)" : "var(--groob-danger)",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: "14px", color: inStock ? "var(--groob-green)" : "var(--groob-danger)", fontWeight: 600 }}>
                {inStock ? `Disponible (${product.stock_qty} en stock)` : "Sin stock"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: "14px", color: "var(--groob-text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                {product.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn-primary animate-pulse-glow"
                onClick={handleAdd}
                disabled={adding || !inStock}
                id="btn-add-cart"
                style={{ fontSize: "16px", padding: "14px", width: "100%" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {adding ? "✓ ¡Agregado al carrito!" : "Añadir al carrito"}
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href={`https://wa.me/573011963515?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp"
                  id="btn-whatsapp-product"
                  style={{ flex: 1, fontSize: "14px" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49" />
                  </svg>
                  Pedir por WhatsApp
                </a>

                <Link href="/cart" className="btn-outline" id="btn-view-cart" style={{ flex: 1, fontSize: "14px" }}>
                  Ver carrito
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
              {[
                { icon: "🚀", text: "Entrega mismo día" },
                { icon: "✅", text: "Pago contraentrega" },
                { icon: "🔒", text: "Compra segura" },
              ].map((t) => (
                <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "var(--groob-text-muted)" }}>
                  <span>{t.icon}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{
          marginTop: 48,
          background: "white",
          borderRadius: 20,
          border: "1px solid var(--groob-border)",
          padding: 32,
          boxShadow: "var(--groob-shadow-sm)",
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: 4 }}>Opiniones del producto</h2>
          <p style={{ fontSize: "13px", color: "var(--groob-text-muted)", marginBottom: 24 }}>
            Las reseñas se publican cuando son verificadas o aprobadas por nuestro equipo.
          </p>
          <ReviewsList productId={product.id} reloadKey={reloadKey} />
          <ReviewForm productId={product.id} onCreated={() => setReloadKey((v) => v + 1)} />
        </div>
      </div>
    </main>
  );
}