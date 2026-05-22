"use client";

import { useEffect, useState, useRef } from "react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/app/components/ProductCard";

interface Props {
  products: Product[];
  onOpenSpin: () => void;
}

export default function FeaturedCarousel({ products, onOpenSpin }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);

  // Duplicar elementos para lograr efecto infinito fluido
  // Para mostrar 4 cartas a la vez, agregamos copias de los primeros 4 elementos al final
  const duplicatedProducts = [...products, ...products.slice(0, 5)];

  // Detectar tamaño de pantalla para actualizar número de productos visibles
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w >= 1024) {
        setVisibleCount(4);
      } else if (w >= 768) {
        setVisibleCount(3);
      } else if (w >= 540) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNext = () => {
    if (!isTransitioning) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isTransitioning) return;
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  // Manejar el salto del infinito sin animación
  useEffect(() => {
    if (currentIndex >= products.length) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 300); // Duración de la transición
      return () => clearTimeout(t);
    }
  }, [currentIndex, products.length]);

  useEffect(() => {
    if (!isTransitioning) {
      // Forzar reflujo de CSS y encender transición de nuevo
      const forceReflow = containerRef.current?.offsetHeight;
      setIsTransitioning(true);
    }
  }, [isTransitioning]);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, isTransitioning]);

  return (
    <div className="featured-section-container" style={{
      display: "flex",
      gap: 20,
      alignItems: "stretch",
      width: "100%",
      flexDirection: "column",
    }}>
      <div style={{
        display: "flex",
        gap: 20,
        width: "100%",
        position: "relative",
      }} className="carousel-row-layout">
        
        {/* ─── CAROUSEL PORT (IZQUIERDA) ─── */}
        <div style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
        }} className="carousel-viewport-col">
          
          {/* Flecha izquierda */}
          <button
            onClick={handlePrev}
            aria-label="Anterior producto"
            className="carousel-arrow-btn left-arrow"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(108, 77, 255, 0.95)",
              border: "2px solid rgba(255, 255, 255, 0.8)",
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(108, 77, 255, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            ←
          </button>

          {/* Flecha derecha */}
          <button
            onClick={handleNext}
            aria-label="Siguiente producto"
            className="carousel-arrow-btn right-arrow"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(108, 77, 255, 0.95)",
              border: "2px solid rgba(255, 255, 255, 0.8)",
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(108, 77, 255, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            →
          </button>

          {/* Contenedor de las tarjetas */}
          <div
            ref={containerRef}
            style={{
              display: "flex",
              gap: 16,
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              transition: isTransitioning ? "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
              width: "100%",
            }}
            className="carousel-slider-track"
          >
            {duplicatedProducts.map((prod, idx) => (
              <div
                key={`${prod.id}-${idx}`}
                style={{
                  flex: `0 0 calc(${100 / visibleCount}% - ${((visibleCount - 1) * 16) / visibleCount}px)`,
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        </div>

        {/* ─── RULETA GIRA Y GANA (DERECHA - FIJA EN DESKTOP) ─── */}
        <div
          className="spin-wheel-card-container"
          style={{
            width: 230,
            flexShrink: 0,
            display: "flex",
          }}
        >
          <div
            className="product-card spin-cta-card"
            onClick={onOpenSpin}
            id="btn-open-spin"
            style={{
              background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 60%, #c4baff 100%)",
              cursor: "pointer",
              border: "none",
              position: "relative",
              overflow: "hidden",
              borderRadius: 20,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px rgba(108, 77, 255, 0.15)",
            }}
          >
            {/* Círculos decorativos */}
            <div style={{
              position: "absolute", width: 120, height: 120, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", top: -30, right: -30,
            }} />
            <div style={{
              position: "absolute", width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", bottom: 20, left: -20,
            }} />
            
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", padding: 24, gap: 16,
              position: "relative",
            }}>
              {/* Rueda animada */}
              <div style={{ animation: "spin 12s linear infinite" }}>
                <svg width="100" height="100" viewBox="0 0 80 80">
                  {[
                    { color: "#b39dff", start: 0 },
                    { color: "#7c63ff", start: 60 },
                    { color: "#9b8cff", start: 120 },
                    { color: "#6c4dff", start: 180 },
                    { color: "#5a3de8", start: 240 },
                    { color: "#c4baff", start: 300 },
                  ].map((seg, i) => {
                    const r = 36, cx = 40, cy = 40, ang = 60;
                    const s = seg.start, e = s + ang;
                    function pt(a: number) {
                      const rad = ((a - 90) * Math.PI) / 180;
                      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
                    }
                    return (
                      <path key={i}
                        d={`M${cx},${cy} L${pt(s)} A${r},${r},0,0,1,${pt(e)} Z`}
                        fill={seg.color} stroke="white" strokeWidth="1.5"
                      />
                    );
                  })}
                  <circle cx="40" cy="40" r="16" fill="white" />
                  <text x="40" y="44" textAnchor="middle" fontSize="9" fontWeight="900" fill="#6c4dff">GIRA</text>
                </svg>
              </div>

              <div style={{ textAlign: "center" }}>
                <span style={{
                  background: "rgba(255,255,255,0.25)",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}>
                  EXCLUSIVO
                </span>
                <p style={{ color: "white", fontWeight: 900, fontSize: 18, lineHeight: 1.2, marginTop: 8 }}>
                  🎁 Gira y Gana
                </p>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 }}>
                  Hasta 75% de descuento en tu primera compra
                </p>
              </div>

              <div className="spin-card-btn" style={{
                background: "white",
                color: "#6c4dff",
                padding: "10px 24px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
              }}>
                ¡Girar ahora!
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Agregar estilos CSS inyectados para el comportamiento de hover en las flechas */}
      <style jsx global>{`
        .carousel-arrow-btn:hover {
          background: #5a3de8 !important;
          transform: translateY(-50%) scale(1.08) !important;
          box-shadow: 0 6px 16px rgba(90, 61, 232, 0.45) !important;
        }
        .carousel-arrow-btn:active {
          transform: translateY(-50%) scale(0.95) !important;
        }
        .spin-cta-card:hover .spin-card-btn {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        /* Estilo responsivo para la ruleta Gira y Gana */
        @media (max-width: 1023px) {
          .carousel-row-layout {
            flex-direction: column;
          }
          .spin-wheel-card-container {
            width: 100% !important;
            height: 180px !important;
          }
          .spin-cta-card > div {
            flex-direction: row !important;
            justify-content: space-around !important;
            padding: 16px 24px !important;
            gap: 20px !important;
          }
          .spin-cta-card svg {
            width: 80px !important;
            height: 80px !important;
          }
        }
      `}</style>
    </div>
  );
}
