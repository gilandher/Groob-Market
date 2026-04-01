import { Suspense } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Product } from "@/types/product";
import HomeClient from "./HomeClient";
import HeroCarousel from "./components/HeroCarousel";

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

const CATEGORIES = [
  { slug: "tecnologia", label: "Tecnología", icon: "💻" },
  { slug: "celulares",  label: "Celulares y accesorios", icon: "📱" },
  { slug: "hogar",      label: "Hogar", icon: "🏠" },
  { slug: "moda",       label: "Moda", icon: "👕" },
  { slug: "belleza",    label: "Belleza", icon: "💄" },
];

export default async function HomePage() {
  let products: Product[] = [];
  try {
    products = await apiGet<Product[]>("/products/");
  } catch {
    products = [];
  }

  const featured = products.slice(0, 4);
  const newProducts = products.slice(4, 10);

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>

      {/* ── HERO CAROUSEL ─────────────────────────────── */}
      <HeroCarousel />


      {/* ── CONTENT ─────────────────────────────────── */}
      <Suspense fallback={
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          Cargando productos...
        </div>
      }>
        <HomeClient
          featured={featured}
          newProducts={newProducts}
          allProducts={products}
          categories={CATEGORIES}
        />
      </Suspense>
    </main>
  );
}