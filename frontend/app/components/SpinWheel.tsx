"use client";

import { useEffect, useRef, useState } from "react";

// ─── Probabilidades estilo casino real (sin pérdida de margen) ───────────────
// Probabilidades aprobadas por el dueño:
//   Sin premio: 17%   | 5%: 40% | 10%: 25% | 15%: 7% | 25%: 7% | 50%: 3% | 65%: 0.5% | 75%: 0.5%
const PRIZES = [
  { label: "😢\nNada",    discount: 0,  prob: 0.17,  color: "#94a3b8", textColor: "#fff" },
  { label: "5%",         discount: 5,  prob: 0.40,  color: "#818cf8", textColor: "#fff" },
  { label: "5%",         discount: 5,  prob: 0.00,  color: "#a5b4fc", textColor: "#fff" }, // alias segundo slot 5%
  { label: "10%",        discount: 10, prob: 0.25,  color: "#7c63ff", textColor: "#fff" },
  { label: "15%",        discount: 15, prob: 0.07,  color: "#6c4dff", textColor: "#fff" },
  { label: "25%",        discount: 25, prob: 0.07,  color: "#5a3de8", textColor: "#fff" },
  { label: "50%",        discount: 50, prob: 0.03,  color: "#4338ca", textColor: "#fff" },
  { label: "65%",        discount: 65, prob: 0.005, color: "#eab308", textColor: "#1a1a1a" },
  { label: "75%",        discount: 75, prob: 0.005, color: "#f59e0b", textColor: "#1a1a1a" },
];

// Build cumulative probability table
const CUMULATIVE = PRIZES.reduce<number[]>((acc, p) => {
  const last = acc.length > 0 ? acc[acc.length - 1] : 0;
  acc.push(last + p.prob);
  return acc;
}, []);

// Pick a winner using weighted random
function pickWinner(): number {
  const r = Math.random();
  for (let i = 0; i < CUMULATIVE.length; i++) {
    if (r < CUMULATIVE[i]) return i;
  }
  return 0;
}

const TOTAL = PRIZES.length;
const ANGLE = 360 / TOTAL;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPath(idx: number, cx: number, cy: number, r: number) {
  const start = idx * ANGLE;
  const end = start + ANGLE;
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = ANGLE > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r},0,${largeArc},1,${e.x},${e.y} Z`;
}

export default function SpinWheel({ onClose }: { onClose: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [spun, setSpun] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);
  const prevRotation = useRef(0);

  // Check if already spun this session
  useEffect(() => {
    const alreadySpun = sessionStorage.getItem("groob_wheel_spun");
    if (alreadySpun) {
      const savedIdx = Number(sessionStorage.getItem("groob_wheel_winner") ?? "0");
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

    // Pick winner using probabilities
    const idx = pickWinner();

    // Calculate the rotation that lands on the winner segment
    // The pointer is at the top (12 o'clock). Segment `idx` starts at idx*ANGLE.
    // Center of that segment is at idx*ANGLE + ANGLE/2.
    // We need to rotate so the center of the winner segment aligns with 0° (top).
    const targetAngle = idx * ANGLE + ANGLE / 2; // center of winning segment
    // We want to spin AT LEAST 5 full rotations (1800°) + correction
    const correction = (360 - targetAngle) % 360;
    const fullSpins = 1800 + (Math.floor(Math.random() * 3) * 360);
    const newRotation = prevRotation.current + fullSpins + correction;

    setRotation(newRotation);
    prevRotation.current = newRotation;

    setTimeout(() => {
      setSpinning(false);
      setSpun(true);
      setWinnerIdx(idx);

      // Generate coupon code
      if (PRIZES[idx].discount > 0) {
        const code = `GROOB${PRIZES[idx].discount}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        setCouponCode(code);
        // Save to localStorage for use in cart
        localStorage.setItem("groob_spin_coupon", JSON.stringify({
          code, discount: PRIZES[idx].discount, expires: Date.now() + 86400000
        }));
        sessionStorage.setItem("groob_wheel_code", code);
      }

      sessionStorage.setItem("groob_wheel_spun", "1");
      sessionStorage.setItem("groob_wheel_winner", String(idx));
      sessionStorage.setItem("groob_wheel_rotation", String(newRotation));
    }, 5000);
  }

  function copyCoupon() {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function sendToWhatsApp() {
    if (!couponCode) return;
    const text = encodeURIComponent(
      `🎰 ¡Gané en la ruleta de Groob Market!\nMi código de descuento: *${couponCode}*\n¿Me pueden aplicar ${PRIZES[winnerIdx!].discount}% de descuento en mi pedido?`
    );
    window.open(`https://wa.me/573011963515?text=${text}`, "_blank");
  }

  const winner = winnerIdx !== null ? PRIZES[winnerIdx] : null;
  const cx = 150, cy = 150, r = 132, inner = 42;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}>
              🎰 Groob Market
            </p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "2px 0 0" }}>
              ¡Gira y Gana!
            </h2>
          </div>
          <button
            onClick={onClose}
            id="spin-close"
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
              width: 32, height: 32, color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        <div style={{ padding: "20px 24px 28px" }}>
          <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Un giro por cuenta 🎁 · Válido 24 horas · Solo primera compra
          </p>

          {/* Wheel */}
          <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto 20px" }}>
            {/* Pointer */}
            <div style={{
              position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
              zIndex: 10, fontSize: "28px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            }}>
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
                const lp = polarToCartesian(cx, cy, r * 0.68, mid);
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
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
              {/* Outer ring */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fff" strokeWidth="3" />
              {/* Center */}
              <circle cx={cx} cy={cy} r={inner} fill="white" stroke="#e5e7f0" strokeWidth="3" />
              <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
                fill="#6c4dff" fontSize="12" fontWeight="900">
                {spinning ? "..." : "GIRA"}
              </text>
              <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
                fill="#9b8cff" fontSize="9" fontWeight="700">
                ¡YA!
              </text>
            </svg>
          </div>

          {/* Result */}
          {spun && winner && (
            <div style={{
              background: winner.discount > 0
                ? "linear-gradient(135deg, #6c4dff, #9b8cff)"
                : "#f8fafc",
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
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
                    Válido 24 horas en tu primera compra
                  </p>
                  {couponCode && (
                    <div style={{
                      background: "rgba(255,255,255,0.2)", borderRadius: 12,
                      padding: "10px 16px", marginTop: 12,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    }}>
                      <code style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "0.05em" }}>
                        {couponCode}
                      </code>
                      <button
                        onClick={copyCoupon}
                        style={{
                          background: "rgba(255,255,255,0.3)", border: "none", color: "#fff",
                          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        {copied ? "✓ Copiado" : "Copiar"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 28, margin: "0 0 4px" }}>😢</p>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "#374151" }}>Esta vez no fue…</p>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    ¡Pero hay ofertas increíbles esperándote!
                  </p>
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
              {winner && winner.discount > 0 && (
                <button
                  onClick={sendToWhatsApp}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12, border: "none",
                    background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 15,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/>
                  </svg>
                  Aplicar por WhatsApp
                </button>
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
            <div style={{
              marginTop: 16, padding: "12px 16px",
              background: "#f8fafc", borderRadius: 12,
              border: "1px solid #f1f5f9",
            }}>
              <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>
                📊 Probabilidades del sorteo:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                {[
                  { l: "Sin premio", p: "17%" },
                  { l: "5%", p: "40%" },
                  { l: "10%", p: "25%" },
                  { l: "15%", p: "7%" },
                  { l: "25%", p: "7%" },
                  { l: "50%", p: "3%" },
                  { l: "65% / 75%", p: "0.5% c/u" },
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
