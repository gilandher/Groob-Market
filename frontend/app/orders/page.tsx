"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  id: number; product_name: string; product_sku: string;
  qty: number; unit_price: number; line_subtotal: number;
}
interface Order {
  id: number; order_number: string;
  status: string; status_display: string; status_emoji: string;
  full_name: string; email: string;
  city: string; department: string;
  subtotal: number; discount_total: number; shipping_cost: number; total: number;
  coupon_code: string; coupon_discount: number;
  logistics_company: string; tracking_number: string;
  same_day: boolean;
  created_at: string; updated_at: string;
  items: OrderItem[];
}

const STATUS_STEPS = [
  { key: "NEW",        emoji: "🆕", label: "Pedido\nRecibido",    color: "#6c4dff" },
  { key: "CONFIRMED",  emoji: "✅", label: "Confirmado",           color: "#059669" },
  { key: "PACKING",    emoji: "📦", label: "Empacando\ncon amor", color: "#d97706" },
  { key: "ON_THE_WAY", emoji: "🛵", label: "En Camino",            color: "#2563eb" },
  { key: "LOGISTICS",  emoji: "🚚", label: "Empresa\nLogística",   color: "#7c3aed" },
  { key: "DELIVERED",  emoji: "🎉", label: "Entregado\ncon éxito", color: "#059669" },
];

function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}

function StatusTimeline({ status }: { status: string }) {
  const steps = STATUS_STEPS.filter(s => s.key !== "LOGISTICS");
  const currentIdx = steps.findIndex(s => s.key === status);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, minWidth: 340 }}>
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 18, left: "50%", width: "100%",
                  height: 3, borderRadius: 2,
                  background: i < currentIdx ? step.color : "#e2e8f0",
                  zIndex: 0,
                }} />
              )}
              {/* Circle */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", zIndex: 1,
                background: current ? step.color : done ? "#22c55e" : "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                boxShadow: current ? `0 0 0 4px ${step.color}33` : "none",
                transition: "all 0.3s",
              }}>
                {done ? step.emoji : <span style={{ color: "#94a3b8", fontSize: 12 }}>○</span>}
              </div>
              {/* Label */}
              <p style={{
                fontSize: 9, marginTop: 6, textAlign: "center", lineHeight: 1.3,
                color: current ? step.color : done ? "#22c55e" : "#94a3b8",
                fontWeight: current ? 800 : done ? 700 : 500,
                whiteSpace: "pre-line",
              }}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.created_at).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
    timeZone: "America/Bogota",
  });
  const isCanceled = order.status === "CANCELED";

  return (
    <div style={{
      background: "#fff", border: `2px solid ${isCanceled ? "#fecaca" : "#f1f5f9"}`,
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        background: isCanceled ? "#fef2f2" : "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        borderBottom: "1px solid rgba(108,77,255,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{date}</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{order.order_number}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{
            display: "inline-block", padding: "4px 12px", borderRadius: 20,
            fontSize: 11, fontWeight: 800,
            background: isCanceled ? "#fef2f2" : "#fff",
            color: isCanceled ? "#dc2626" : "#6c4dff",
            border: `1.5px solid ${isCanceled ? "#fecaca" : "#ddd6fe"}`,
          }}>
            {order.status_emoji} {order.status_display}
          </span>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{formatCOP(order.total)}</p>
        </div>
      </div>

      {/* Timeline */}
      {!isCanceled && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc" }}>
          <StatusTimeline status={order.status} />
        </div>
      )}

      {/* Summary */}
      <div style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            📦 {order.items.length} producto{order.items.length !== 1 ? "s" : ""} ·
            📍 {order.city}, {order.department}
            {order.same_day && <span style={{ color: "#22c55e", fontWeight: 700 }}> · 🛵 Mismo día</span>}
          </p>
          <button onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#6c4dff" }}>
            {expanded ? "▲ Ocultar" : "▼ Ver detalle"}
          </button>
        </div>

        {/* Tracking number */}
        {order.tracking_number && (
          <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "8px 12px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>🔍 Guía: {order.tracking_number}</p>
            <p style={{ fontSize: 11, color: "#166534" }}>{order.logistics_company}</p>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 20px 16px", borderTop: "1px solid #f8fafc", marginTop: 4 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, marginTop: 14 }}>Productos:</h4>
          {order.items.map(it => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#374151" }}>{it.product_name} <span style={{ color: "#94a3b8" }}>×{it.qty}</span></span>
              <span style={{ fontWeight: 700 }}>{formatCOP(it.line_subtotal)}</span>
            </div>
          ))}

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
            {(([
              ["Subtotal", formatCOP(order.subtotal)],
              order.discount_total > 0 ? [`🎁 Descuento (${order.coupon_code})`, `-${formatCOP(order.discount_total)}`] : null,
              ["Envío", order.shipping_cost === 0 ? "✅ Gratis" : formatCOP(order.shipping_cost)],
            ].filter(Boolean)) as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, marginTop: 4, paddingTop: 8, borderTop: "2px solid #f1f5f9" }}>
              <span>Total</span>
              <span style={{ color: "#6c4dff" }}>{formatCOP(order.total)}</span>
            </div>
          </div>

          <a href={`https://wa.me/573011963515?text=${encodeURIComponent(`Hola, consulto por mi pedido ${order.order_number}`)}`}
            target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, padding: "10px", borderRadius: 10, background: "#25d366", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            💬 Consultar por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [error, setError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

  async function fetchOrders(emailQuery: string) {
    if (!emailQuery) return;
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("groob_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Try authenticated first, then by-email
      const endpoint = token
        ? `${API}/orders/my/`
        : `${API}/orders/by-email/?email=${encodeURIComponent(emailQuery)}`;

      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error("No se encontraron pedidos.");
      const data = await res.json();
      setOrders(data.results ?? data);
    } catch (e) {
      setError("No encontramos pedidos. Verifica el correo o inicia sesión.");
      setOrders([]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("groob_user") || "{}");
      if (user.email) {
        setEmail(user.email);
        setSearchEmail(user.email);
        fetchOrders(user.email);
      } else { setLoading(false); }
    } catch { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchEmail(email);
    fetchOrders(email);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px" }}>

        <Link href="/" style={{ color: "var(--groob-purple)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Volver a la tienda</Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 24px", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900 }}>📋 Mis Pedidos</h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Rastrea el estado de todos tus pedidos</p>
          </div>
        </div>

        {/* Email search */}
        <form onSubmit={handleSearch} style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 24, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔍 Buscar pedidos por correo</p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "Inter,sans-serif" }}
            />
            <button type="submit" className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}>Buscar</button>
          </div>
        </form>

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 40, height: 40, border: "3px solid #ede9fe", borderTop: "3px solid #6c4dff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#64748b", fontSize: 14 }}>Cargando pedidos...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>😕</p>
            <p style={{ fontWeight: 700, color: "#dc2626" }}>{error}</p>
            <Link href="/" style={{ display: "inline-block", marginTop: 12, color: "#6c4dff", fontWeight: 700, fontSize: 14 }}>Ir a comprar →</Link>
          </div>
        )}

        {!loading && !error && orders.length === 0 && searchEmail && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 64 }}>📭</div>
            <h3 style={{ marginTop: 12, fontWeight: 800 }}>Sin pedidos aún</h3>
            <p style={{ color: "#64748b", marginTop: 4 }}>No encontramos pedidos para <strong>{searchEmail}</strong></p>
            <Link href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 20, padding: "12px 28px" }}>¡Hacer mi primer pedido!</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#64748b" }}>{orders.length} pedido{orders.length !== 1 ? "s" : ""} encontrado{orders.length !== 1 ? "s" : ""}</p>
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        )}
      </div>
    </main>
  );
}
