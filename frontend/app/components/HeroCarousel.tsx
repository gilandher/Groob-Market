"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Slides de publicidad ─────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "main",
    badge: "🛍️ VITRINA VIRTUAL",
    title: "Tu Tecnología Favorita,",
    highlight: "Entregada Hoy",
    desc: "Los mejores gadgets, celulares y accesorios con entrega el mismo día en el Área Metropolitana de Medellín.",
    cta: { label: "🛍️ Ver Productos", href: "#catalogo", style: "white" },
    cta2: { label: "💬 WhatsApp", href: "https://wa.me/573011963515" },
    image: "/hero-products.png",
    bg: "linear-gradient(135deg, #6c4dff 0%, #7c5fff 40%, #9b7eff 70%, #a78bfa 100%)",
    accent: "#c4b5fd",
    stats: [
      { icon: "🚀", text: "Mismo día" },
      { icon: "💳", text: "Contraentrega" },
      { icon: "⭐", text: "4.9 / 5 rating" },
    ],
  },
  {
    id: "flash",
    badge: "⚡ FLASH SALE — HOY HASTA 8 PM",
    title: "Hasta 40% OFF",
    highlight: "en Tecnología",
    desc: "Precios de lunes que no vuelven. Celulares, audífonos, cargadores y más con descuentos reales.",
    cta: { label: "⚡ Ver Ofertas", href: "/?cat=tecnologia", style: "white" },
    cta2: { label: "🎰 Girar Ruleta", href: "#spin" },
    image: "/slide_flash.png",
    bg: "linear-gradient(135deg, #ef4444 0%, #f97316 60%, #fbbf24 100%)",
    accent: "#fde68a",
    stats: [
      { icon: "🔥", text: "Últimas unidades" },
      { icon: "🎁", text: "Cupones gratis" },
      { icon: "⏰", text: "Solo hoy" },
    ],
  },
  {
    id: "envio",
    badge: "🚚 ENVÍOS A TODA COLOMBIA",
    title: "Comprá desde",
    highlight: "Cualquier Ciudad",
    desc: "Valle de Aburrá recibe hoy. El resto del país en 1-3 días con Coordinadora, Envía y Servientrega.",
    cta: { label: "📦 Ver Catálogo", href: "#catalogo", style: "white" },
    cta2: { label: "📍 Ver ciudades", href: "/orders" },
    image: "/slide_shipping.png",
    bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)",
    accent: "#bae6fd",
    stats: [
      { icon: "🛵", text: "Valle de Aburrá hoy" },
      { icon: "📦", text: "Nación 1-3 días" },
      { icon: "🔒", text: "100% seguro" },
    ],
  },
  {
    id: "marcas",
    badge: "🤝 MARCAS ALIADAS",
    title: "Cueros Vélez, Samsung,",
    highlight: "HomeCenter y más",
    desc: "Llegamos a acuerdos comerciales con las mejores marcas para traerte sus productos directamente.",
    cta: { label: "🏷️ Ver Marcas", href: "#partners", style: "white" },
    cta2: { label: "📩 Ser aliado", href: "https://wa.me/573011963515?text=Quiero%20ser%20aliado%20de%20Groob%20Market" },
    image: "/slide_brands.png",
    bg: "linear-gradient(135deg, #7c3aed 0%, #9b8cff 50%, #c4b5fd 100%)",
    accent: "#ddd6fe",
    stats: [
      { icon: "🏪", text: "Moda" },
      { icon: "🏠", text: "Hogar" },
      { icon: "📱", text: "Tecnología" },
    ],
  },
  {
    id: "seguro",
    badge: "✅ COMPRA 100% SEGURA",
    title: "Paga Cuando",
    highlight: "Recibes tu Pedido",
    desc: "Contraentrega disponible en todo el país. No pagas hasta tener el producto en tus manos. Sin riesgos.",
    cta: { label: "🛒 Comprar Ahora", href: "#catalogo", style: "white" },
    cta2: { label: "📋 Mis Pedidos", href: "/orders" },
    image: "/slide_secure.png",
    bg: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
    accent: "#a7f3d0",
    stats: [
      { icon: "✅", text: "Contraentrega" },
      { icon: "📋", text: "Factura por email" },
      { icon: "🛡️", text: "Garantía" },
    ],
  },
];

export default function HeroCarousel({ onOpenSpin }: { onOpenSpin?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [animDir, setAnimDir] = useState<"left" | "right">("left");
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = SLIDES.length;

  const go = useCallback((idx: number, dir: "left" | "right" = "left") => {
    setPrev(current);
    setAnimDir(dir);
    setCurrent((idx + total) % total);
  }, [current, total]);

  const next = useCallback(() => go((current + 1) % total, "left"), [current, go, total]);
  const prev_ = useCallback(() => go((current - 1 + total) % total, "right"), [current, go, total]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => next(), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  const slide = SLIDES[current];

  function handleCta2(e: React.MouseEvent<HTMLAnchorElement>) {
    if (slide.cta2.href === "#spin") {
      e.preventDefault();
      if (onOpenSpin) onOpenSpin();
      else window.dispatchEvent(new Event("open_spin_wheel"));
    } else if (slide.cta2.href === "#partners") {
      e.preventDefault();
      document.querySelector("[data-section='partners']")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Publicidad y promociones Groob Market"
    >
      {/* ── Background gradient transition ── */}
      <div
        className="hero-carousel-bg"
        style={{ background: slide.bg }}
        aria-hidden="true"
      />

      {/* ── Decorative orbs ── */}
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-orb hero-orb-3" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="hero-carousel-inner">
        <div className="hero-slide-content" key={current}>

          {/* Badge */}
          <div className="hero-badge">
            <span className="hero-badge-dot" style={{ background: slide.accent }} />
            {slide.badge}
          </div>

          {/* Title */}
          <h1 className="hero-title">
            {slide.title}{" "}
            <span className="hero-highlight" style={{ color: slide.accent }}>
              {slide.highlight}
            </span>
          </h1>

          {/* Description */}
          <p className="hero-desc">{slide.desc}</p>

          {/* CTAs */}
          <div className="hero-btns">
            <Link
              href={slide.cta.href}
              className="hero-cta-primary"
              style={slide.cta.style === "white" ? {
                background: "#fff",
                color: "#6c4dff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              } : {}}
            >
              {slide.cta.label}
            </Link>
            <a
              href={slide.cta2.href}
              onClick={handleCta2}
              target={slide.cta2.href.startsWith("http") ? "_blank" : undefined}
              rel={slide.cta2.href.startsWith("http") ? "noreferrer" : undefined}
              className="hero-cta-secondary"
            >
              {slide.cta2.label}
            </a>
          </div>

          {/* Stats / badges */}
          <div className="hero-badges">
            {slide.stats.map(s => (
              <div key={s.text} className="hero-stat">
                <span>{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="hero-carousel-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt={`${slide.title} ${slide.highlight}`}
            className="animate-float"
          />
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      <button
        onClick={prev_}
        className="hero-arrow hero-arrow-left"
        aria-label="Slide anterior"
      >
        ‹
      </button>
      <button
        onClick={() => next()}
        className="hero-arrow hero-arrow-right"
        aria-label="Siguiente slide"
      >
        ›
      </button>

      {/* ── Dot indicators ── */}
      <div className="hero-dots" role="tablist" aria-label="Slides de publicidad">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === current}
            onClick={() => go(i, i > current ? "left" : "right")}
            className={`hero-dot ${i === current ? "hero-dot-active" : ""}`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Progress bar ── */}
      <div className="hero-progress-bar" aria-hidden="true">
        <div
          className="hero-progress-fill"
          key={`${current}-progress`}
          style={{ animationPlayState: paused ? "paused" : "running" }}
        />
      </div>
    </section>
  );
}
