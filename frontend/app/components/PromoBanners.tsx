"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Banners de promoción ─────────────────────────────────────────────────────
const PROMO_BANNERS = [
  {
    id: "flash",
    title: "⚡ Flash Sale",
    subtitle: "Solo hoy hasta las 8 PM",
    desc: "Hasta 40% OFF en tecnología y celulares",
    cta: "Ver ofertas →",
    href: "/?cat=tecnologia",
    bg: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
    tag: "TERMINA HOY",
    tagColor: "#fff",
    tagBg: "rgba(255,255,255,0.25)",
    emoji: "🔥",
  },
  {
    id: "new",
    title: "🆕 Recién llegados",
    subtitle: "Nuevos productos esta semana",
    desc: "Celulares, audífonos y más accesorios",
    cta: "Ver novedades →",
    href: "/?cat=celulares",
    bg: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
    tag: "NUEVO",
    tagColor: "#fff",
    tagBg: "rgba(255,255,255,0.25)",
    emoji: "✨",
  },
  {
    id: "entrega",
    title: "🚀 Entrega el mismo día",
    subtitle: "Medellín · Bello · Itagüí · Envigado",
    desc: "Pide antes de las 5 PM y recibe hoy",
    cta: "Comprar ahora →",
    href: "/",
    bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    tag: "EXPRESS",
    tagColor: "#fff",
    tagBg: "rgba(255,255,255,0.2)",
    emoji: "🛵",
  },
  {
    id: "spin",
    title: "🎰 Gira y Gana",
    subtitle: "Descuentos exclusivos cada día",
    desc: "Hasta 75% OFF en tu primera compra",
    cta: "¡Girar ahora! →",
    href: "#spin",
    bg: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    tag: "EXCLUSIVO",
    tagColor: "#fff",
    tagBg: "rgba(255,255,255,0.2)",
    emoji: "🎁",
  },
];

// ─── Marcas aliadas ───────────────────────────────────────────────────────────
const PARTNER_BRANDS = [
  // Moda
  { name: "Cueros Vélez", cat: "Moda", icon: "👜", color: "#92400e", bg: "#fef3c7", href: "https://www.cuerosvelezcol.com" },
  { name: "Fly Up", cat: "Moda", icon: "👕", color: "#1e40af", bg: "#eff6ff", href: "#" },
  { name: "ELA", cat: "Moda", icon: "👗", color: "#9d174d", bg: "#fdf2f8", href: "#" },
  { name: "Studio F", cat: "Moda", icon: "👒", color: "#065f46", bg: "#ecfdf5", href: "#" },
  // Hogar
  { name: "HomeCenter", cat: "Hogar", icon: "🏠", color: "#b45309", bg: "#fffbeb", href: "https://www.homecenter.com.co" },
  { name: "Éxito", cat: "Hogar", icon: "🛒", color: "#166534", bg: "#f0fdf4", href: "https://www.exito.com" },
  { name: "Jumbo", cat: "Hogar", icon: "🏪", color: "#1e3a8a", bg: "#eff6ff", href: "https://www.tiendasjumbo.co" },
  // Tecnología
  { name: "Apple", cat: "Tecnología", icon: "🍎", color: "#374151", bg: "#f9fafb", href: "#" },
  { name: "Samsung", cat: "Tecnología", icon: "📱", color: "#1d4ed8", bg: "#eff6ff", href: "#" },
  { name: "Xiaomi", cat: "Tecnología", icon: "📲", color: "#dc2626", bg: "#fef2f2", href: "#" },
];

// ─── Flash Sale Countdown ─────────────────────────────────────────────────────
function FlashCountdown() {
  // Start at 0 on server, calculate real value client-side after mount
  const [secs, setSecs] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const now = new Date();
    const end = new Date();
    end.setHours(20, 0, 0, 0);
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    setSecs(diff);
    setMounted(true);

    const t = setInterval(() => setSecs(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Don't render countdown until mounted (avoids hydration mismatch)
  if (!mounted) return null;

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[[h, "h"], [m, "m"], [s, "s"]].map(([v, l]) => (
        <div key={String(l)} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            background: "rgba(255,255,255,0.2)", borderRadius: 8,
            padding: "4px 8px", fontSize: 18, fontWeight: 900, color: "#fff",
            minWidth: 36, textAlign: "center",
          }}>
            {pad(Number(v))}
          </div>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Banner Carousel (auto-sliding) ──────────────────────────────────────────
export function PromoBanners({ onOpenSpin }: { onOpenSpin?: () => void }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(v => (v + 1) % PROMO_BANNERS.length), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function go(idx: number) {
    setCurrent(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(v => (v + 1) % PROMO_BANNERS.length), 4500);
  }

  const b = PROMO_BANNERS[current];

  function handleCta(e: React.MouseEvent) {
    if (b.href === "#spin") {
      e.preventDefault();
      onOpenSpin?.();
    }
  }

  return (
    <div style={{ marginBottom: 36 }}>
      {/* ─ Main carousel banner ─ */}
      <div style={{
        background: b.bg, borderRadius: 20, overflow: "hidden",
        minHeight: 140, position: "relative",
        transition: "background 0.4s ease",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        {/* Decorative orb */}
        <div style={{
          position: "absolute", right: -40, top: -40,
          width: 220, height: 220, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)", pointerEvents: "none",
        }} />

        <div style={{
          padding: "24px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative",
        }}>
          <div style={{ flex: 1 }}>
            {/* Tag */}
            <span style={{
              display: "inline-block", padding: "3px 10px", borderRadius: 20,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
              background: b.tagBg, color: b.tagColor, marginBottom: 8,
            }}>
              {b.tag}
            </span>

            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, lineHeight: 1.2, margin: "0 0 4px" }}>
              {b.title}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: "0 0 12px" }}>
              {b.desc}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Link href={b.href} onClick={handleCta}
                style={{
                  padding: "9px 20px", background: "rgba(255,255,255,0.2)",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              >
                {b.cta}
              </Link>

              {b.id === "flash" && <FlashCountdown />}
            </div>
          </div>

          {/* Emoji */}
          <div style={{ fontSize: 72, opacity: 0.9, flexShrink: 0, marginLeft: 20 }}>
            {b.emoji}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: 6, padding: "0 28px 16px" }}>
          {PROMO_BANNERS.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              style={{
                width: i === current ? 24 : 8, height: 8, borderRadius: 4,
                background: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                border: "none", cursor: "pointer", transition: "all 0.3s",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ─ Quick promo tiles ─ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10, marginTop: 10,
      }}>
        {PROMO_BANNERS.map((banner, i) => (
          <Link key={banner.id} href={banner.href}
            onClick={banner.href === "#spin" ? (e) => { e.preventDefault(); onOpenSpin?.(); } : undefined}
            style={{
              padding: "12px 14px", borderRadius: 14,
              background: i === current ? banner.bg : "#fff",
              border: `1.5px solid ${i === current ? "transparent" : "#f1f5f9"}`,
              textDecoration: "none", transition: "all 0.25s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
            }}
          >
            <p style={{ fontSize: 20, marginBottom: 4 }}>{banner.emoji}</p>
            <p style={{
              fontSize: 12, fontWeight: 800,
              color: i === current ? "#fff" : "#0f172a",
              lineHeight: 1.3,
            }}>
              {banner.title.replace(/^[^\s]+\s/, "")}
            </p>
            <p style={{
              fontSize: 10, fontWeight: 500,
              color: i === current ? "rgba(255,255,255,0.8)" : "#94a3b8",
              marginTop: 2,
            }}>
              {banner.subtitle}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Partner Brands Section ───────────────────────────────────────────────────
export function PartnerBrands() {
  const grouped: Record<string, typeof PARTNER_BRANDS> = {};
  PARTNER_BRANDS.forEach(b => {
    if (!grouped[b.cat]) grouped[b.cat] = [];
    grouped[b.cat].push(b);
  });

  return (
    <section style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            🤝 Marcas Aliadas
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            Llegamos a acuerdos para traerte los mejores productos de marca
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, brands]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
            📌 {category}
          </h3>
          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap",
          }}>
            {brands.map(brand => (
              <a key={brand.name} href={brand.href} target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 16px", borderRadius: 12,
                  background: brand.bg, border: `1.5px solid ${brand.color}22`,
                  textDecoration: "none", transition: "all 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${brand.color}20`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }}
              >
                <span style={{ fontSize: 18 }}>{brand.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: brand.color }}>{brand.name}</span>
                {brand.href !== "#" && (
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>↗</span>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Partnership CTA */}
      <div style={{
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        border: "1.5px solid rgba(108,77,255,0.2)",
        borderRadius: 16, padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
            🚀 ¿Tu empresa quiere ser aliada de Groob Market?
          </p>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            Llega a miles de clientes en el Área Metropolitana de Medellín
          </p>
        </div>
        <a href="https://wa.me/573011963515?text=Hola%20Groob%20Market!%20Me%20interesa%20ser%20aliado%20comercial%20🤝"
          target="_blank" rel="noreferrer"
          style={{
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
            color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Contáctanos →
        </a>
      </div>
    </section>
  );
}
