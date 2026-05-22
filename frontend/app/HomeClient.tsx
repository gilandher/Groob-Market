"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/types/product";
import { ProductCard, ProductListItem } from "@/app/components/ProductCard";
import SpinWheel from "@/app/components/SpinWheel";
import { PromoBanners, PartnerBrands } from "@/app/components/PromoBanners";
import HeroCarousel from "@/app/components/HeroCarousel";
import FeaturedCarousel from "@/app/components/FeaturedCarousel";

type Category = { slug: string; label: string; icon: string };

interface Props {
  featured: Product[];
  newProducts: Product[];
  allProducts: Product[];
  categories: Category[];
}

const SORT_OPTIONS = [
  { value: "default", label: "Relevancia" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name-asc", label: "A - Z" },
];

// Normalize text: removes diacritics/tildes so 'celular' matches 'Celular', 'Télefono' matches 'telefono'
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u").replace(/[ñ]/g, "n");
}

export default function HomeClient({ featured, newProducts, allProducts, categories }: Props) {
  const [showSpin, setShowSpin] = useState(false);
  const searchParams = useSearchParams();
  const searchQ = searchParams?.get("search") || "";
  const cat = searchParams?.get("cat") || "all";
  const [sort, setSort] = useState("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Auto-show spin wheel first visit & handle global open event
  useEffect(() => {
    const handleOpenSpin = () => setShowSpin(true);
    window.addEventListener("open_spin_wheel", handleOpenSpin);

    const seen = sessionStorage.getItem("groob_spin_shown");
    if (!seen) {
      const t = setTimeout(() => {
        setShowSpin(true);
        sessionStorage.setItem("groob_spin_shown", "1");
      }, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("open_spin_wheel", handleOpenSpin);
      };
    }
    return () => window.removeEventListener("open_spin_wheel", handleOpenSpin);
  }, []);

  // Filter + sort products — with accent-insensitive search
  const normalizedQ = normalize(searchQ);
  const filtered = allProducts.filter(p => {
    const matchCat = !cat || cat === "all" || p.category?.slug === cat;
    const matchQ = !normalizedQ ||
      normalize(p.name).includes(normalizedQ) ||
      normalize(p.description || "").includes(normalizedQ) ||
      normalize(p.category?.name || "").includes(normalizedQ);
    return matchCat && matchQ;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.sale_price - b.sale_price;
    if (sort === "price-desc") return b.sale_price - a.sale_price;
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  const showFeatured = !searchQ && cat === "all";
  const showNewProducts = !searchQ && cat === "all";

  return (
    <>
      {showSpin && <SpinWheel onClose={() => setShowSpin(false)} />}

      {/* ── HERO CAROUSEL — hidden during search ── */}
      {!searchQ && <HeroCarousel />}

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px" }}>

        {/* ── SEARCH RESULTS BANNER ── */}
        {searchQ && (
          <div style={{
            background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
            border: "1px solid rgba(108,77,255,0.2)", borderRadius: 16,
            padding: "16px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <div>
              <p style={{ fontWeight: 700, color: "#0f172a" }}>
                {sorted.length} resultado{sorted.length !== 1 ? "s" : ""} para &quot;{searchQ}&quot;
              </p>
              <Link href="/" style={{ fontSize: 13, color: "#6c4dff", textDecoration: "none" }}>
                ← Volver al catálogo
              </Link>
            </div>
          </div>
        )}

        {/* ── FEATURED OFFERS ── */}
        {showFeatured && featured.length > 0 && (
          <section id="catalogo" style={{ marginBottom: 44 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  ⚡ Ofertas Destacadas
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Los más vendidos esta semana</p>
              </div>
              <Link href="/?cat=destacados"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 13, color: "#6c4dff", fontWeight: 700, textDecoration: "none",
                  padding: "6px 14px", borderRadius: 8, background: "#f5f3ff",
                }}>
                Ver todos <span>→</span>
              </Link>
            </div>

            <FeaturedCarousel products={featured} onOpenSpin={() => setShowSpin(true)} />
          </section>
        )}

        {/* ── ALL PRODUCTS / FILTERED ── */}
        <section style={{ marginBottom: 40 }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {searchQ ? `Resultados para "${searchQ}"` : cat !== "all" ? `Categoría seleccionada` : "🛍️ Todos los Productos"}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                {sorted.length} producto{sorted.length !== 1 ? "s" : ""} encontrado{sorted.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Sort */}
              <select
                value={sort} onChange={e => setSort(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff",
                  cursor: "pointer", fontFamily: "'Inter', sans-serif", outline: "none",
                }}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* View toggle */}
              <div style={{ display: "flex", gap: 4, background: "#f8fafc", borderRadius: 10, padding: 4 }}>
                {(["grid", "list"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: "none",
                      background: view === v ? "#fff" : "transparent",
                      color: view === v ? "#6c4dff" : "#94a3b8",
                      cursor: "pointer",
                      boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                    {v === "grid" ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="0" y="0" width="6" height="6" rx="1.5"/><rect x="10" y="0" width="6" height="6" rx="1.5"/>
                        <rect x="0" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="0" y="1" width="16" height="3" rx="1.5"/>
                        <rect x="0" y="7" width="16" height="3" rx="1.5"/>
                        <rect x="0" y="13" width="16" height="3" rx="1.5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          {sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>No encontramos productos</h3>
              <p style={{ color: "#64748b", marginBottom: 24 }}>
                {searchQ ? `No hay resultados para "${searchQ}"` : "No hay productos en esta categoría aún"}
              </p>
              <Link href="/" className="btn-primary" style={{ textDecoration: "none" }}>
                Ver todos los productos
              </Link>
            </div>
          ) : view === "grid" ? (
            <div className="products-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 16,
            }}>
              {sorted.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sorted.map((p) => (
                <ProductListItem key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ── PARTNER BRANDS & PROMO BANNERS BOTTOM ── */}
        {!searchQ && cat === "all" && (
          <>
            <div style={{ marginTop: 8 }}>
              <PartnerBrands />
            </div>
            <div style={{ marginTop: 24, marginBottom: 20 }}>
              <PromoBanners onOpenSpin={() => setShowSpin(true)} />
            </div>
          </>
        )}

        {/* ── TRUST BADGES ── */}
        <section style={{
          background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
          border: "1px solid rgba(108,77,255,0.15)",
          borderRadius: 20, padding: "28px 24px", marginBottom: 20,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 20,
          }}>
            {[
              { icon: "🚀", title: "Entrega mismo día", desc: "Pedidos antes de las 5 PM" },
              { icon: "💳", title: "Pago contraentrega", desc: "Paga cuando recibas" },
              { icon: "🔒", title: "Compra segura", desc: "Datos 100% protegidos" },
              { icon: "🔄", title: "Garantía", desc: "30 días de garantía" },
            ].map(b => (
              <div key={b.title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0, boxShadow: "0 2px 8px rgba(108,77,255,0.1)",
                }}>
                  {b.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{b.title}</p>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
