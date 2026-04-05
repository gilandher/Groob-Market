"use client";

import { useEffect, useRef, useState } from "react";

// ─── Probabilidades ajustadas (menos descuento, mejor margen del negocio) ────
// Nada: 45% | 5%: 35% | 10%: 15% | 15%: 3% | 25%: 1.5% | 50%: 0.4% | 65%: 0.07% | 75%: 0.03%
const PRIZES = [
  { label: "😢\nNada",  discount: 0,  prob: 0.45,  color: "#94a3b8", textColor: "#fff" },
  { label: "5%",        discount: 5,  prob: 0.35,  color: "#818cf8", textColor: "#fff" },
  { label: "5%",        discount: 5,  prob: 0.00,  color: "#a5b4fc", textColor: "#fff" }, // alias
  { label: "10%",       discount: 10, prob: 0.15,  color: "#7c63ff", textColor: "#fff" },
  { label: "15%",       discount: 15, prob: 0.03,  color: "#6c4dff", textColor: "#fff" },
  { label: "25%",       discount: 25, prob: 0.015, color: "#5a3de8", textColor: "#fff" },
  { label: "50%",       discount: 50, prob: 0.004, color: "#4338ca", textColor: "#fff" },
  { label: "65%",       discount: 65, prob: 0.0007,color: "#eab308", textColor: "#1a1a1a" },
  { label: "75%",       discount: 75, prob: 0.0003,color: "#f59e0b", textColor: "#1a1a1a" },
];

const CUMULATIVE = PRIZES.reduce<number[]>((acc, p) => {
  acc.push((acc[acc.length - 1] ?? 0) + p.prob);
  return acc;
}, []);

function pickWinner(): number {
  const r = Math.random();
  for (let i = 0; i < CUMULATIVE.length; i++) {
    if (r < CUMULATIVE[i]) return i;
  }
  return 0;
}

const TOTAL = PRIZES.length;
const ANGLE  = 360 / TOTAL;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPath(idx: number, cx: number, cy: number, r: number) {
  const start = idx * ANGLE;
  const end   = start + ANGLE;
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = ANGLE > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r},0,${largeArc},1,${e.x},${e.y} Z`;
}

// Mask coupon code for non-logged users: GROOB5-XXXX → GROOB5-****
function maskCode(code: string): string {
  const parts = code.split("-");
  if (parts.length < 2) return code.slice(0, -4) + "****";
  return `${parts[0]}-****`;
}

export default function SpinWheel({ onClose }: { onClose: () => void }) {
  const [rotation, setRotation]   = useState(0);
  const [spinning, setSpinning]   = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [spun, setSpun]           = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied]       = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const prevRotation = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("groob_token");
    setIsLoggedIn(!!token);

    // Restore previous spin if already done this session
    const alreadySpun = sessionStorage.getItem("groob_wheel_spun");
    if (alreadySpun) {
      const savedIdx  = Number(sessionStorage.getItem("groob_wheel_winner") ?? "0");
      const savedCode = sessionStorage.getItem("groob_wheel_code") ?? "";
      setWinnerIdx(savedIdx);
      setCouponCode(savedCode);
      setSpun(true);
      setRotation(Number(sessionStorage.getItem("groob_wheel_rotation") ?? "0"));
    }
  }, []);

  function spin() {
    if (spinning || spun) return;
    setSpinning(true);

    const idx = pickWinner();
    const targetAngle  = idx * ANGLE + ANGLE / 2;
    const correction   = (360 - targetAngle) % 360;
    const fullSpins    = 1800 + (Math.floor(Math.random() * 3) * 360);
    const newRotation  = prevRotation.current + fullSpins + correction;

    setRotation(newRotation);
    prevRotation.current = newRotation;

    setTimeout(() => {
      setSpinning(false);
      setSpun(true);
      setWinnerIdx(idx);

      if (PRIZES[idx].discount > 0) {
        const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
        const code   = `GROOB${PRIZES[idx].discount}-${suffix}`;
        setCouponCode(code);

        // 3 days expiry (72h)
        const expiresAt = Date.now() + 3 * 24 * 3600 * 1000;
        localStorage.setItem("groob_spin_coupon", JSON.stringify({
          code, discount: PRIZES[idx].discount, expires: expiresAt, maxItems: 4,
        }));
        sessionStorage.setItem("groob_wheel_code", code);
      }

      sessionStorage.setItem("groob_wheel_spun", "1");
      sessionStorage.setItem("groob_wheel_winner", String(idx));
      sessionStorage.setItem("groob_wheel_rotation", String(newRotation));
    }, 5000);
  }

  function copyCoupon() {
    if (!couponCode || !isLoggedIn) return;
    navigator.clipboard.writeText(couponCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openAuthModal() {
    onClose();
    setTimeout(() => window.dispatchEvent(new CustomEvent("groob_open_auth")), 100);
  }

  const winner = winnerIdx !== null ? PRIZES[winnerIdx] : null;
  const cx = 150, cy = 150, r = 132, inner = 42;

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 9500 }}
    >
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460,
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        overflow: "hidden", position: "relative",
        maxHeight: "95vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          padding: "20px 24px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}>🎰 Groob Market</p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "2px 0 0" }}>¡Gira y Gana!</h2>
          </div>
          <button
            onClick={onClose} id="spin-close"
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
              width: 32, height: 32, color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        <div style={{ padding: "20px 24px 28px" }}>
          <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Un giro por cuenta 🎁 · Válido <strong>3 días</strong> · Solo primera compra · Máx. 4 artículos
          </p>

          {/* Wheel */}
          <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto 20px" }}>
            <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", zIndex: 10, fontSize: "28px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
              🔺
            </div>
            <svg
              width="300" height="300" viewBox="0 0 300 300"
              style={{
                transition: spinning ? "transform 5s cubic-bezier(0.17,0.67,0.08,0.99)" : "none",
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center",
                filter: "drop-shadow(0 8px 24px rgba(108,77,255,0.3))",
              }}
            >
              {PRIZES.map((seg, i) => {
                const mid = i * ANGLE + ANGLE / 2;
                const lp  = polarToCartesian(cx, cy, r * 0.68, mid);
                return (
                  <g key={i}>
                    <path d={buildPath(i, cx, cy, r)} fill={seg.color} stroke="#fff" strokeWidth="2.5" />
                    <text
                      x={lp.x} y={lp.y}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={seg.textColor || "#fff"}
                      fontSize={seg.discount === 0 ? "11" : "13"}
                      fontWeight="900"
                      transform={`rotate(${mid}, ${lp.x}, ${lp.y})`}
                    >{seg.label}</text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fff" strokeWidth="3" />
              <circle cx={cx} cy={cy} r={inner} fill="white" stroke="#e5e7f0" strokeWidth="3" />
              <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fill="#6c4dff" fontSize="12" fontWeight="900">
                {spinning ? "..." : "GIRA"}
              </text>
              <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fill="#9b8cff" fontSize="9" fontWeight="700">¡YA!</text>
            </svg>
          </div>

          {/* Result */}
          {spun && winner && (
            <div style={{
              background: winner.discount > 0 ? "linear-gradient(135deg, #6c4dff, #9b8cff)" : "#f8fafc",
              border: winner.discount > 0 ? "none" : "1.5px solid #e2e8f0",
              borderRadius: 16, padding: "16px 20px", marginBottom: 16, textAlign: "center",
              animation: "fadeInUp 0.4s ease",
            }}>
              {winner.discount > 0 ? (
                <>
                  <p style={{ fontSize: 32, margin: "0 0 4px" }}>🎉</p>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>
                    ¡Ganaste {winner.discount}% de descuento!
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
                    Válido 3 días · Solo primera compra · Máx. 4 artículos
                  </p>

                  {/* Coupon code — masked if not logged in */}
                  {couponCode && (
                    <div style={{
                      background: "rgba(255,255,255,0.2)", borderRadius: 12,
                      padding: "10px 16px", marginTop: 12,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    }}>
                      <code style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "0.05em" }}>
                        {isLoggedIn ? couponCode : maskCode(couponCode)}
                      </code>
                      {isLoggedIn ? (
                        <button
                          onClick={copyCoupon}
                          style={{
                            background: "rgba(255,255,255,0.3)", border: "none", color: "#fff",
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          {copied ? "✓ Copiado" : "Copiar"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                          🔒 Inicia sesión para ver el código
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 28, margin: "0 0 4px" }}>😢</p>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "#374151" }}>Esta vez no fue…</p>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>¡Pero hay ofertas increíbles esperándote!</p>
                </>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          {!spun ? (
            <button
              className="btn-primary"
              onClick={spin}
              disabled={spinning}
              id="btn-spin-wheel"
              style={{ width: "100%", fontSize: 16, padding: "14px" }}
            >
              {spinning ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Girando...
                </span>
              ) : "🎰 ¡Girar Ahora!"}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {winner && winner.discount > 0 && !isLoggedIn && (
                <>
                  <button
                    onClick={openAuthModal}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #6c4dff, #9b8cff)", color: "#fff",
                      fontWeight: 700, fontSize: 15, cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    🎁 ¡Regístrate y aplica tu descuento!
                  </button>
                  <button
                    onClick={openAuthModal}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                      background: "#f8fafc", color: "#374151",
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    🔑 Ya tengo cuenta — Ingresar y aplicar
                  </button>
                </>
              )}
              {winner && winner.discount > 0 && isLoggedIn && (
                <div style={{
                  background: "#f0fdf4", border: "1px solid #86efac",
                  borderRadius: 12, padding: "12px 16px", textAlign: "center",
                }}>
                  <p style={{ fontWeight: 700, color: "#166534", fontSize: 13 }}>
                    ✅ Tu código está guardado. Úsalo en el carrito al finalizar tu compra.
                  </p>
                  <p style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>
                    Aplica para máximo 4 artículos
                  </p>
                </div>
              )}
              <button
                onClick={onClose}
                className="btn-outline"
                style={{ width: "100%", padding: "12px" }}
              >
                Ver ofertas en la tienda →
              </button>
            </div>
          )}

          {/* Probability disclaimer */}
          {!spun && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>📊 Probabilidades del sorteo:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                {[
                  { l: "Sin premio", p: "45%" },
                  { l: "5%", p: "35%" },
                  { l: "10%", p: "15%" },
                  { l: "15%", p: "3%" },
                  { l: "25%", p: "1.5%" },
                  { l: "50%+", p: "<0.5%" },
                ].map(item => (
                  <span key={item.l} style={{ fontSize: 10, color: "#64748b" }}>
                    <strong>{item.l}</strong>: {item.p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
