"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCart, updateQty, removeFromCart, clearCart, type CartItem,
} from "../../lib/cart";
import { ColombiaShipping, estimateShipping, VALLE_ABURRA } from "../components/ColombiaShipping";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}

interface Coupon { code: string; discount: number; expires: number; }

function getCoupon(): Coupon | null {
  try {
    const raw = localStorage.getItem("groob_spin_coupon");
    if (!raw) return null;
    const c = JSON.parse(raw) as Coupon;
    if (Date.now() > c.expires) { localStorage.removeItem("groob_spin_coupon"); return null; }
    return c;
  } catch { return null; }
}

// ─── WhatsApp message builder (premium con emojis) ─────────────────────────────
function buildWhatsApp(
  items: CartItem[], sub: number, disc: number, total: number,
  coupon: Coupon | null,
  form: { name: string; email: string; phone: string; dept: string; city: string; address: string; address2: string; notes: string },
  shipping: { cost: number; label: string; sameDay: boolean }
): string {
  const date = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
  const orderNum = `GM-${Date.now().toString().slice(-6)}`;
  const parts: string[] = [
    `🛍️ *GROOB MARKET — NUEVO PEDIDO* 🛍️`,
    `🔖 Ref: *${orderNum}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🛒 *PRODUCTOS SOLICITADOS:*`,
  ];
  items.forEach((it, i) => {
    parts.push(`${i + 1}. 📦 *${it.name}*`);
    parts.push(`    🏷️ SKU: ${it.sku || "N/A"} | ×${it.qty} | ${formatCOP(it.sale_price)} c/u`);
    parts.push(`    💵 Subtotal ítem: *${formatCOP(it.sale_price * it.qty)}*`);
  });
  parts.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━━`, `💰 *RESUMEN DEL PEDIDO:*`);
  parts.push(`   • Subtotal: ${formatCOP(sub)}`);
  if (coupon && disc > 0) {
    parts.push(`   • 🎁 Cupón *${coupon.code}* (-${coupon.discount}%): -${formatCOP(disc)}`);
  }
  parts.push(`   • 🚚 Envío: ${shipping.sameDay ? "✅ Gratis (mismo día)" : "Por confirmar"}`);
  parts.push(`   ➤ *TOTAL: ${formatCOP(total)}*`);
  parts.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━━`, `📍 *DATOS DE ENTREGA:*`);
  parts.push(`   👤 Nombre: *${form.name}*`);
  parts.push(`   📧 Email: ${form.email}`);
  parts.push(`   📱 WhatsApp: *${form.phone}*`);
  parts.push(`   🏠 Dirección: ${form.address}${form.address2 ? ` (${form.address2})` : ""}`);
  parts.push(`   🌆 Ciudad: *${form.city}, ${form.dept}*`);
  if (form.notes) parts.push(`   📝 Notas: _${form.notes}_`);
  parts.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━━`);
  parts.push(`💳 *Pago:* Contra entrega`);
  parts.push(shipping.sameDay
    ? `🛵 *Entrega:* Hoy mismo (Valle de Aburrá)`
    : `📦 *Entrega:* 1-3 días hábiles · Coordinadora / Servientrega / Envía`);
  parts.push(`🕐 Pedido generado: ${date}`);
  parts.push(``, `_Mensaje generado automáticamente por groobmarket.com_ ✨`);
  return encodeURIComponent(parts.join("\n"));
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────────────
export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    dept: "Antioquia", city: "Medellín",
    address: "", address2: "", notes: "",
  });

  useEffect(() => {
    setItems(getCart());
    setCoupon(getCoupon());
    // Pre-fill email from localStorage if logged in
    try {
      const user = JSON.parse(localStorage.getItem("groob_user") || "{}");
      if (user.email) setForm(f => ({ ...f, email: user.email, name: user.name || "" }));
    } catch {}
  }, []);

  const subtotal = useMemo(() => items.reduce((a, it) => a + it.sale_price * it.qty, 0), [items]);
  const discountAmt = coupon ? Math.round(subtotal * coupon.discount / 100) : 0;
  const shipping = useMemo(() => estimateShipping(form.city), [form.city]);
  const total = subtotal - discountAmt + shipping.cost;
  const totalItems = items.reduce((a, it) => a + it.qty, 0);

  const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  function applyCoupon() {
    const c = getCoupon();
    if (c && couponInput.trim().toUpperCase() === c.code.toUpperCase()) {
      setCoupon(c); setCouponError("");
    } else { setCouponError("Código inválido o expirado"); }
  }

  function validateForm() {
    if (!form.name.trim()) return "Ingresa tu nombre completo";
    if (!form.email.trim() || !form.email.includes("@")) return "Ingresa un correo electrónico válido";
    if (!form.phone.trim() || form.phone.length < 7) return "Ingresa un número de WhatsApp válido";
    if (!form.dept) return "Selecciona tu departamento";
    if (!form.city) return "Selecciona tu ciudad";
    if (!form.address.trim()) return "Ingresa tu dirección de entrega";
    return "";
  }

  async function sendOrder() {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setFormError(""); setSending(true);

    // 1. POST al backend
    try {
      const body = {
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.dept,
        city: form.city,
        address: form.address,
        address2: form.address2,
        notes: form.notes,
        payment_method: "COD",
        coupon_code: coupon?.code || "",
        coupon_discount: coupon?.discount || 0,
        items: items.map(it => ({
          product_id: it.product_id,
          qty: it.qty,
          name: it.name,
          sku: it.sku,
          sale_price: it.sale_price,
        })),
      };
      const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
      await fetch(`${API}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.warn("Backend no disponible, continuando con WhatsApp:", e);
    }

    // 2. WhatsApp
    const msg = buildWhatsApp(items, subtotal, discountAmt, total, coupon, { ...form, dept: form.dept }, shipping);
    window.open(`https://wa.me/573011963515?text=${msg}`, "_blank");

    // 3. Factura en ventana nueva
    const invoiceHTML = buildInvoiceHTML(items, subtotal, discountAmt, total, coupon, form, shipping);
    const w = window.open("", "_blank");
    if (w) { w.document.write(invoiceHTML); w.document.close(); setTimeout(() => w.print(), 800); }

    // 4. Limpiar
    clearCart(); setItems([]); setSent(true);
    localStorage.removeItem("groob_spin_coupon");
    window.dispatchEvent(new Event("groob_cart_update"));
    setSending(false);
  }

  // ── SUCCESS PAGE ─────────────────────────────────────────────────────────────
  if (sent) return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 520, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 80, animation: "float 3s ease-in-out infinite" }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 16 }}>¡Pedido enviado!</h1>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, marginTop: 8 }}>
          Te llegará un correo de confirmación a <strong>{form.email}</strong>.<br />
          Nuestro equipo confirmará tu pedido por WhatsApp muy pronto. 💜
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <Link href="/" className="btn-primary" style={{ padding: "12px 28px" }}>Seguir comprando</Link>
          <Link href="/orders" style={{ padding: "12px 28px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontWeight: 700, fontSize: 14, color: "#374151", textDecoration: "none" }}>Ver mis pedidos</Link>
        </div>
      </div>
    </main>
  );

  if (!items.length) return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 480, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 72 }}>🛒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 16 }}>Tu carrito está vacío</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>Explora nuestra tienda y agrega lo que te guste.</p>
        <Link href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 24, padding: "13px 32px", fontSize: 15 }}>Ir a la tienda</Link>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={{ color: "var(--groob-purple)", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>← Seguir comprando</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
            Mi Carrito <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>({totalItems} artículo{totalItems !== 1 ? "s" : ""})</span>
          </h1>
        </div>

        {/* ── Layout ── */}
        <div className="cart-layout">

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Items */}
            {items.map(it => (
              <div key={it.product_id} className="cart-item-card">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.name} className="cart-item-img" />
                ) : (
                  <div className="cart-item-img-placeholder">📦</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{it.name}</p>
                  {it.sku && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>SKU: {it.sku}</p>}
                  <p style={{ fontSize: 17, fontWeight: 900, color: "var(--groob-purple)", marginTop: 6 }}>{formatCOP(it.sale_price)}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setItems(updateQty(it.product_id, it.qty - 1))} className="qty-btn">−</button>
                    <span style={{ fontWeight: 800, minWidth: 24, textAlign: "center" }}>{it.qty}</span>
                    <button onClick={() => setItems(updateQty(it.product_id, it.qty + 1))} className="qty-btn">+</button>
                    <button onClick={() => setItems(removeFromCart(it.product_id))}
                      style={{ marginLeft: "auto", color: "#ef4444", fontSize: 12, fontWeight: 600, border: "none", background: "none", cursor: "pointer" }}>
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 14 }}>
                  <p style={{ color: "#94a3b8", fontSize: 11 }}>Subtotal</p>
                  <p style={{ fontWeight: 800, marginTop: 2 }}>{formatCOP(it.sale_price * it.qty)}</p>
                </div>
              </div>
            ))}

            {/* Coupon */}
            <div className="cart-section-card">
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🎁 ¿Tienes un cupón?</p>
              {coupon ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <p style={{ fontWeight: 800, color: "#166534" }}>✅ {coupon.code}</p>
                    <p style={{ fontSize: 12, color: "#166534" }}>-{coupon.discount}% → ahorras {formatCOP(discountAmt)}</p>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponInput(""); localStorage.removeItem("groob_spin_coupon"); }}
                    style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Quitar</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="GROOB10-XXXXX"
                    style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", outline: "none", fontFamily: "Inter,sans-serif" }} />
                  <button onClick={applyCoupon} className="btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>Aplicar</button>
                </div>
              )}
              {couponError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 600 }}>{couponError}</p>}
            </div>

            {/* Checkout form */}
            {showCheckout && (
              <div className="cart-section-card" style={{ border: "1.5px solid #6c4dff", boxShadow: "0 4px 20px rgba(108,77,255,0.1)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📋 Datos de entrega</h3>

                {[
                  { key: "name",  label: "Nombre completo *",          placeholder: "Andrés García", type: "text" },
                  { key: "email", label: "Correo electrónico *",        placeholder: "tu@correo.com", type: "email" },
                  { key: "phone", label: "WhatsApp / Teléfono *",       placeholder: "301 234 5678", type: "tel" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <label className="form-label">{f.label}</label>
                    <input type={f.type} value={form[f.key as keyof typeof form]}
                      onChange={e => setField(f.key, e.target.value)}
                      placeholder={f.placeholder} className="form-input" />
                  </div>
                ))}

                {/* Colombia Shipping selector */}
                <ColombiaShipping
                  department={form.dept} city={form.city}
                  onDepartmentChange={d => setField("dept", d)}
                  onCityChange={c => setField("city", c)}
                />

                {/* Dirección */}
                <div style={{ marginBottom: 12, marginTop: 12 }}>
                  <label className="form-label">Dirección principal *</label>
                  <input type="text" value={form.address} onChange={e => setField("address", e.target.value)}
                    placeholder="Cra 50 #30-10" className="form-input" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Apto / Piso / Torre <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional)</span></label>
                  <input type="text" value={form.address2} onChange={e => setField("address2", e.target.value)}
                    placeholder="Apto 204, Torre B" className="form-input" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Instrucciones adicionales <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional)</span></label>
                  <input type="text" value={form.notes} onChange={e => setField("notes", e.target.value)}
                    placeholder="Llamar antes de llegar, portería azul..." className="form-input" />
                </div>

                {formError && (
                  <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                    ⚠️ {formError}
                  </div>
                )}

                <button onClick={sendOrder} disabled={sending}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: sending ? "#94a3b8" : "#25d366", color: "#fff", fontWeight: 800, fontSize: 16, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                  id="btn-send-whatsapp">
                  {sending ? (
                    <><span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Enviando...</>
                  ) : (
                    <><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/></svg>Confirmar pedido por WhatsApp</>
                  )}
                </button>
                <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
                  Recibirás email de confirmación + factura en pantalla
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Summary */}
          <div className="cart-summary-card">
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 18 }}>Resumen del pedido</h2>

            {items.map(it => (
              <div key={it.product_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#64748b", flex: 1, paddingRight: 8 }}>{it.name} ×{it.qty}</span>
                <span style={{ fontWeight: 600 }}>{formatCOP(it.sale_price * it.qty)}</span>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>Subtotal</span>
                <span style={{ fontWeight: 700 }}>{formatCOP(subtotal)}</span>
              </div>
              {coupon && discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#22c55e" }}>Cupón -{coupon.discount}%</span>
                  <span style={{ fontWeight: 700, color: "#22c55e" }}>-{formatCOP(discountAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Envío</span>
                <span style={{ color: shipping.sameDay ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
                  {shipping.sameDay ? "✅ Gratis" : "Por confirmar"}
                </span>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius: 14, padding: "14px 16px", margin: "14px 0" }}>
              <p style={{ fontSize: 12, color: "#64748b" }}>Total estimado</p>
              <p style={{ fontSize: 28, fontWeight: 900 }}>{formatCOP(total)}</p>
              {shipping.sameDay && <p style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, marginTop: 2 }}>🛵 Entrega hoy mismo</p>}
              {!shipping.sameDay && form.city && <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>📦 Envío nacional coordinar</p>}
            </div>

            <button className="btn-primary" id="btn-checkout"
              onClick={() => setShowCheckout(!showCheckout)}
              style={{ width: "100%", fontSize: 15, padding: "14px" }}>
              {showCheckout ? "▲ Ocultar formulario" : "📦 Completar pedido →"}
            </button>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
              {["🛵 Entrega mismo día en Valle de Aburrá",
                "📦 Envíos a todo Colombia",
                "✅ Pago contraentrega disponible",
                "🔒 Compra 100% segura",
                "📋 Factura + email de confirmación"].map(t => (
                <p key={t} style={{ fontSize: 12, color: "#64748b" }}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Invoice HTML ─────────────────────────────────────────────────────────────
function buildInvoiceHTML(
  items: CartItem[], sub: number, disc: number, total: number,
  coupon: Coupon | null,
  form: { name: string; email: string; phone: string; dept: string; city: string; address: string; address2: string; notes: string },
  shipping: { cost: number; label: string; sameDay: boolean }
): string {
  const orderNum = `GM-${Date.now().toString().slice(-6)}`;
  const date = new Date().toLocaleDateString("es-CO");
  const rows = items.map(it => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;">${it.name}<br><small style="color:#94a3b8">SKU: ${it.sku || "N/A"}</small></td>
      <td style="padding:10px 8px;text-align:center;border-bottom:1px solid #f1f5f9;">${it.qty}</td>
      <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #f1f5f9;">${formatCOP(it.sale_price)}</td>
      <td style="padding:10px 8px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700;">${formatCOP(it.sale_price * it.qty)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Factura ${orderNum}</title></head>
<body style="font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
<div style="max-width:680px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6c4dff,#9b8cff);padding:28px 32px;display:flex;justify-content:space-between;align-items:center;">
    <div><h1 style="color:white;font-size:24px;font-weight:900;margin:0;">Groob Market</h1><p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">Vitrina Virtual · Medellín</p></div>
    <div style="text-align:right;"><p style="color:white;font-weight:700;font-size:16px;margin:0;">FACTURA</p><p style="color:rgba(255,255,255,0.9);font-size:14px;margin:4px 0 0;">#${orderNum}</p><p style="color:rgba(255,255,255,0.7);font-size:12px;">${date}</p></div>
  </div>
  <div style="padding:28px 32px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
      <div><h3 style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">DATOS DEL CLIENTE</h3>
        <p style="font-weight:700;font-size:16px;margin:0 0 4px;">${form.name}</p>
        <p style="color:#64748b;font-size:13px;">📱 ${form.phone}</p>
        <p style="color:#64748b;font-size:13px;">📧 ${form.email}</p>
      </div>
      <div><h3 style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">ENTREGA</h3>
        <p style="font-weight:600;font-size:14px;margin:0 0 4px;">${form.address}${form.address2 ? ` — ${form.address2}` : ""}</p>
        <p style="color:#64748b;font-size:13px;">${form.city}, ${form.dept}</p>
        ${form.notes ? `<p style="color:#6c4dff;font-size:12px;margin-top:4px;">Nota: ${form.notes}</p>` : ""}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PRODUCTO</th>
        <th style="padding:10px 8px;text-align:center;font-size:12px;color:#64748b;">CANT.</th>
        <th style="padding:10px 8px;text-align:right;font-size:12px;color:#64748b;">P/U</th>
        <th style="padding:10px 8px;text-align:right;font-size:12px;color:#64748b;">TOTAL</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="border-top:2px solid #f1f5f9;padding-top:14px;">
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;"><span style="color:#64748b;">Subtotal</span><strong>${formatCOP(sub)}</strong></div>
      ${coupon && disc > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;color:#22c55e;"><span>🎁 Cupón ${coupon.code} (-${coupon.discount}%)</span><strong>-${formatCOP(disc)}</strong></div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;"><span style="color:#64748b;">Envío</span><span style="color:#22c55e;font-weight:600;">${shipping.sameDay ? "Gratis (mismo día)" : "Por confirmar"}</span></div>
      <div style="display:flex;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:12px;margin-top:8px;">
        <span style="font-weight:800;font-size:18px;">TOTAL</span><span style="font-weight:900;font-size:22px;color:#6c4dff;">${formatCOP(total)}</span>
      </div>
    </div>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px 16px;margin-top:18px;">
      <p style="font-weight:700;color:#166534;margin:0;">✅ Pago Contra Entrega</p>
      <p style="color:#166534;font-size:12px;margin:4px 0 0;">Pagas cuando recibes. 100% seguro.</p>
    </div>
  </div>
  <div style="padding:16px 32px;text-align:center;background:#f8fafc;border-top:1px solid #f1f5f9;">
    <p style="color:#64748b;font-size:12px;margin:0;">Soporte: wa.me/573011963515 · groobmarket.com</p>
  </div>
</div></body></html>`;
}