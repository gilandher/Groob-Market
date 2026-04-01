"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart, clearCart, type CartItem } from "@/lib/cart";

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

type CreateOrderResponse = {
  id: number;
  status: string;
  total: number;
  whatsapp_url?: string;
};

const DEFAULT_WA_NUMBER = "573011963515";
const CITIES = ["Bello", "Medellín", "Itagüí", "Envigado", "Sabaneta"];

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(null);
  const [placedCart, setPlacedCart] = useState<CartItem[]>([]);
  const [placedTotal, setPlacedTotal] = useState<number>(0);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bello");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "WHATSAPP">("COD");

  useEffect(() => { setItems(getCart()); }, []);

  const total = useMemo(() => items.reduce((acc, it) => acc + it.sale_price * it.qty, 0), [items]);
  const displayCart = orderResult ? placedCart : items;
  const displayTotal = orderResult ? placedTotal : total;

  function buildFallbackWaUrl(orderId: number) {
    const lines = [
      "Hola Groob Market 👋",
      `Quiero confirmar mi pedido #${orderId}.`,
      "",
      "Datos de entrega:",
      `- Nombre: ${fullName || "-"}`,
      `- Teléfono: ${phone || "-"}`,
      `- Ciudad: ${city || "-"}`,
      `- Dirección: ${address || "-"}`,
      notes ? `- Notas: ${notes}` : "",
      "",
      "Productos:",
      ...displayCart.map((it) => `- ${it.qty} × ${it.name} = ${formatCOP(it.sale_price * it.qty)}`),
      "",
      `Total: ${formatCOP(displayTotal)}`,
      `Método de pago: ${paymentMethod === "COD" ? "Contraentrega (COD)" : "WhatsApp"}`,
    ].filter(Boolean);
    return `https://wa.me/${DEFAULT_WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setOrderResult(null);

    if (!items.length) { setMsg("Tu carrito está vacío."); return; }
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setMsg("Completa nombre, teléfono y dirección.");
      return;
    }

    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
      const snapshotCart = [...items];
      const snapshotTotal = total;

      const res = await fetch(`${apiBase}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
          notes: notes.trim(),
          payment_method: paymentMethod,
          items: items.map((it) => ({ product_id: it.product_id, qty: it.qty })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as any;

      setPlacedCart(snapshotCart);
      setPlacedTotal(snapshotTotal);
      setOrderResult({
        id: data.id,
        status: data.status ?? "NEW",
        total: data.total ?? snapshotTotal,
        whatsapp_url: data.whatsapp_url || data.whatsapp_link || data.whatsapp || undefined,
      });
      clearCart();
      setItems([]);
      setMsg("success");
    } catch (err: any) {
      setMsg(`Error: ${err?.message || "Ocurrió un error"}`);
    } finally {
      setLoading(false);
    }
  }

  if (!items.length && !orderResult) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🛒</div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: 8 }}>Carrito vacío</h1>
          <p style={{ color: "var(--groob-text-muted)", marginBottom: 28 }}>Agrega productos antes de proceder al pago.</p>
          <Link href="/" className="btn-primary" style={{ fontSize: "15px", padding: "13px 32px" }}>Ir a la tienda</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/cart" style={{ color: "var(--groob-purple)", fontSize: "13px", textDecoration: "none" }}>
            ← Volver al carrito
          </Link>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginTop: 6 }}>Checkout</h1>
        </div>

        {/* Success State */}
        {msg === "success" && orderResult && (
          <div style={{
            background: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
            border: "1.5px solid #6ee7b7",
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 28,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#065f46", marginBottom: 6 }}>
              ¡Pedido #{orderResult.id} creado!
            </h2>
            <p style={{ color: "#047857", marginBottom: 20 }}>
              Estado: <strong>{orderResult.status}</strong> · Total: <strong>{formatCOP(orderResult.total)}</strong>
            </p>
            <a
              href={orderResult.whatsapp_url || buildFallbackWaUrl(orderResult.id)}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
              id="btn-confirm-wa"
              style={{ fontSize: "16px", padding: "14px 32px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49" />
              </svg>
              Confirmar por WhatsApp
            </a>
            <p style={{ marginTop: 16, fontSize: "12px", color: "#6b7280" }}>
              Te contactaremos para coordinar la entrega.
            </p>
          </div>
        )}

        {!orderResult && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28, alignItems: "start" }}>

            {/* Delivery form */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--groob-border)", padding: "28px", boxShadow: "var(--groob-shadow-sm)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: 24 }}>Datos de entrega</h2>

              <form onSubmit={submitOrder} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="field-label">Nombre completo *</label>
                    <input id="inp-name" className="field-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej: Andrés Inciarte" required />
                  </div>
                  <div>
                    <label className="field-label">Teléfono / WhatsApp *</label>
                    <input id="inp-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 3011963515" required />
                  </div>
                </div>

                <div>
                  <label className="field-label">Ciudad *</label>
                  <select id="inp-city" className="field-input" value={city} onChange={(e) => setCity(e.target.value)}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="field-label">Dirección *</label>
                  <input id="inp-address" className="field-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Cra 50 #30-20, Bello" required />
                </div>

                <div>
                  <label className="field-label">Notas (opcional)</label>
                  <textarea id="inp-notes" className="field-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones adicionales para la entrega..." style={{ resize: "vertical" }} />
                </div>

                {/* Payment method */}
                <div>
                  <label className="field-label">Método de pago</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ value: "COD", label: "💵 Contraentrega" }, { value: "WHATSAPP", label: "💬 WhatsApp" }].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value as any)}
                        id={`pay-${opt.value.toLowerCase()}`}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: 12,
                          border: `2px solid ${paymentMethod === opt.value ? "var(--groob-purple)" : "var(--groob-border)"}`,
                          background: paymentMethod === opt.value ? "var(--groob-purple-bg)" : "white",
                          color: paymentMethod === opt.value ? "var(--groob-purple)" : "var(--groob-text-muted)",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ marginTop: 8, fontSize: "11px", color: "var(--groob-text-muted)" }}>
                    Próximamente: PayU y Wompi para pago en línea.
                  </p>
                </div>

                {msg && msg !== "success" && (
                  <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: 10, color: "#b91c1c", fontSize: "14px", fontWeight: 600 }}>
                    ⚠️ {msg}
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-order"
                  disabled={loading}
                  className="btn-primary"
                  style={{ fontSize: "16px", padding: "15px", width: "100%", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Creando pedido..." : "Confirmar pedido"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div style={{
              background: "white", borderRadius: 20, border: "1px solid var(--groob-border)",
              padding: "24px", boxShadow: "var(--groob-shadow)", position: "sticky", top: 80,
            }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: 20 }}>Resumen</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {displayCart.map((it) => (
                  <div key={it.product_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "var(--groob-bg)", padding: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--groob-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📦</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }}>{it.name}</p>
                      <p style={{ fontSize: "12px", color: "var(--groob-text-muted)" }}>{it.qty} × {formatCOP(it.sale_price)}</p>
                    </div>
                    <p style={{ fontWeight: 700, flexShrink: 0, fontSize: "14px" }}>{formatCOP(it.sale_price * it.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "14px" }}>
                <span style={{ color: "var(--groob-text-muted)" }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatCOP(displayTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: "14px" }}>
                <span style={{ color: "var(--groob-text-muted)" }}>Domicilio</span>
                <span style={{ color: "var(--groob-green)", fontWeight: 600 }}>Por zona</span>
              </div>

              <div style={{
                background: "linear-gradient(135deg, var(--groob-purple-bg), #fff)",
                borderRadius: 12, padding: "14px 16px",
                border: "1px solid rgba(108,77,255,0.15)",
              }}>
                <p style={{ fontSize: "12px", color: "var(--groob-text-muted)" }}>Total a pagar</p>
                <p style={{ fontSize: "28px", fontWeight: 900, color: "var(--groob-text)" }}>{formatCOP(displayTotal)}</p>
              </div>

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {["📍 Entrega en Medellín y Área Metropolitana", "🔒 Datos seguros", "✅ Sin más pasos ocultos"].map((t) => (
                  <p key={t} style={{ fontSize: "12px", color: "var(--groob-text-muted)" }}>{t}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}