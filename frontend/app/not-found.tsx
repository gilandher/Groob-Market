"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe checks after mount to avoid hydration mismatch
  const isAliados = mounted && (pathname?.includes("aliados") || pathname?.includes("partners"));

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      color: "#f8fafc",
      position: "relative",
      overflow: "hidden",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    }}>
      {/* Background neon elements */}
      <div style={{
        position: "absolute", top: "10%", left: "10%", width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(108, 77, 255, 0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(60px)", pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "10%", width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(60px)", pointerEvents: "none"
      }} />

      {/* Main glass box */}
      <div style={{
        maxWidth: 620,
        width: "100%",
        background: "rgba(30, 27, 75, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(108, 77, 255, 0.25)",
        borderRadius: 28,
        padding: "48px 32px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(108, 77, 255, 0.1)",
        textAlign: "center",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
            <path d="M18 22 L8 40 L18 58" stroke="#2ec27e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M62 22 L72 40 L62 58" stroke="#2ec27e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M52 20 A22 22 0 1 0 52 60" stroke="#1565d8" strokeWidth="7" strokeLinecap="round" fill="none"/>
            <line x1="40" y1="10" x2="40" y2="26" stroke="#2ec27e" strokeWidth="6" strokeLinecap="round"/>
            <line x1="40" y1="40" x2="52" y2="40" stroke="#1565d8" strokeWidth="6" strokeLinecap="round"/>
            <rect x="46" y="38" width="8" height="8" rx="2" fill="#2ec27e"/>
          </svg>
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", display: "block", lineHeight: 1.1 }}>
              Groob <span style={{ color: "#9b8cff" }}>Market</span>
            </span>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>VITRINA VIRTUAL</span>
          </div>
        </div>

        {isAliados ? (
          /* ALIADOS / ERP / POS COMING SOON TEMPLATE */
          <div>
            <span style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(108, 77, 255, 0.2))",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399", fontSize: 12, fontWeight: 800,
              padding: "6px 16px", borderRadius: 20, textTransform: "uppercase",
              letterSpacing: 1.5, display: "inline-block", marginBottom: 20
            }}>
              🚀 Muy Pronto — Lanzamiento
            </span>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
              Groob ERP & POS
            </h1>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#9b8cff", marginBottom: 20 }}>
              Digitaliza tu negocio y vende con total control
            </h2>

            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 28, maxWidth: "500px", margin: "0 auto 28px" }}>
              Estamos ultimando los detalles de nuestro sistema integrado de administración, caja POS e inventarios. Muy pronto podrás facturar en segundos, gestionar tu tienda física y sincronizar tus productos con el marketplace de Groob Market automáticamente.
            </p>

            {/* Business Features list */}
            <div style={{
              background: "rgba(15, 23, 42, 0.3)",
              borderRadius: 16,
              padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.05)",
              textAlign: "left",
              marginBottom: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              width: "100%",
            }}>
              {[
                { icon: "📦", title: "Inventario Sincronizado", desc: "Tus productos físicos y virtuales en un solo inventario." },
                { icon: "⚡", title: "Facturación POS Exprés", desc: "Vende en segundos en tu local físico con tickets limpios." },
                { icon: "📊", title: "Reportes Inteligentes", desc: "Estadísticas de ganancias, compras y caja al instante." }
              ].map((feat, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, background: "rgba(108,77,255,0.15)", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, paddingLeft: 4 }}>{feat.icon}</span>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{feat.title}</h4>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0", lineHeight: 1.4 }}>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", width: "100%", flexWrap: "wrap" }}>
              <a
                href="https://wa.me/573001805448?text=Hola%20Groob%20Market!%20Me%20interesa%20pre-registrarme%20como%20aliado%20para%20usar%20el%20ERP%20y%20Facturaci%C3%B3n%20POS%20🤝"
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: "1 1 200px",
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(16,185,129,0.25)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "")}
              >
                🤝 Registrarme como Aliado
              </a>
              <Link
                href="/"
                style={{
                  flex: "1 1 200px",
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          /* STANDARD 404 TEMPLATE */
          <div>
            <span style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171", fontSize: 12, fontWeight: 800,
              padding: "6px 16px", borderRadius: 20, textTransform: "uppercase",
              letterSpacing: 1.5, display: "inline-block", marginBottom: 20
            }}>
              🔍 Error 404 — No Encontrado
            </span>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
              Página no disponible
            </h1>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#94a3b8", marginBottom: 24 }}>
              Parece que has tomado un camino equivocado
            </h2>

            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 36, maxWidth: "450px" }}>
              La dirección que intentas visitar no existe, ha cambiado de ubicación o se encuentra temporalmente fuera de servicio.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", width: "100%", flexWrap: "wrap" }}>
              <Link
                href="/"
                style={{
                  flex: "1 1 200px",
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #6c4dff 0%, #4f46e5 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(108,77,255,0.25)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "")}
              >
                🏠 Ir a Vitrina Virtual
              </Link>
              <a
                href="https://wa.me/573001805448?text=Hola%20Groob!%20Encontr%C3%A9%20un%20error%20en%20la%20p%C3%A1gina%20web%20(Error%20404) 🛠️"
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: "1 1 200px",
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                💬 Reportar un Error
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
