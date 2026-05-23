"use client";

import Link from "next/link";
import Script from "next/script";
import React, { useEffect, useMemo, useState } from "react";
import { getCart, clearCart, type CartItem } from "@/lib/cart";
import { ColombiaShipping } from "../components/ColombiaShipping";

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
  payment_method?: string;
  payment_status?: string;
  wompi_payment_data?: {
    public_key: string;
    reference: string;
    amount_in_cents: number;
    currency: string;
    signature: string;
  } | null;
};

type ShippingQuote = {
  disponible: boolean;
  municipio: string;
  zona: string | null;
  zona_label: string | null;
  precio: number | null;
  precio_fmt: string | null;
  tiempo: string | null;
  mensaje?: string;
  whatsapp_url?: string;
};

const DEFAULT_WA_NUMBER = "573001805448";

// CITIES list removed in favor of ColombiaShipping component

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: "100vh", background: "var(--groob-bg)", padding: "40px 20px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", background: "white", padding: 30, borderRadius: 20, border: "1px solid #fecaca", boxShadow: "var(--groob-shadow-sm)" }}>
            <h2 style={{ fontSize: "20px", color: "#dc2626", fontWeight: 800, marginBottom: 12 }}>⚠️ Error de Renderizado</h2>
            <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: 16 }}>
              Ocurrió un error al cargar la página de pago. Por favor intenta recargar la página.
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10, padding: 16, overflowX: "auto" }}>
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#991b1b", marginBottom: 8 }}>
                {this.state.error?.toString()}
              </p>
              <pre style={{ fontSize: "11px", color: "#b91c1c", fontFamily: "monospace", margin: 0 }}>
                {this.state.error?.stack}
              </pre>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: 20, padding: "10px 20px", background: "var(--groob-purple)", color: "white",
                border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export function CheckoutPageInner() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(null);
  
  console.log("RENDER CheckoutPageInner:", { 
    mounted,
    itemsCount: items.length, 
    items, 
    orderResult, 
    msg 
  });
  const [placedCart, setPlacedCart] = useState<CartItem[]>([]);
  const [placedTotal, setPlacedTotal] = useState<number>(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Antioquia");
  const [city, setCity] = useState("Bello");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "WHATSAPP" | "WOMPI">("COD");

  // Envío
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const cart = getCart() || [];
      const cleanCart = cart.filter((it): it is CartItem => {
        return it !== null && typeof it === "object" && typeof it.product_id === "number" && typeof it.sale_price === "number";
      });
      setItems(cleanCart);
    } catch (e) {
      console.error("Error retrieving cart items:", e);
    }

    if (!document.getElementById("wompi-widget-script")) {
      const script = document.createElement("script");
      script.src = "https://transaction-sandbox.wompi.co/widget.js";
      script.id = "wompi-widget-script";
      script.async = true;
      document.body.appendChild(script);
    }

    try {
      const rawUser = localStorage.getItem("groob_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.first_name) setFirstName(u.first_name);
        if (u.last_name) setLastName(u.last_name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
        if (u.department) setDepartment(u.department);
        if (u.city) setCity(u.city);
        if (u.address) setAddress(u.address);
      }
    } catch (e) {
      console.error("Error loading user data from localStorage:", e);
    }
  }, []);

  // Cotizar envío cuando cambia la ciudad
  useEffect(() => {
    if (!city || city === "Otra ciudad (consultar)") {
      setShipping({ disponible: false, municipio: city, zona: null, zona_label: null, precio: null, precio_fmt: null, tiempo: null });
      return;
    }
    const timer = setTimeout(async () => {
      setShippingLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiBase}/envios/cotizar/?municipio=${encodeURIComponent(city)}`);
        const data: ShippingQuote = await res.json();
        setShipping(data);
      } catch {
        setShipping(null);
      } finally {
        setShippingLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [city]);

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + it.sale_price * it.qty, 0), [items]);

  if (!mounted) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
          <div style={{ marginBottom: 28 }}>
            <span style={{ color: "var(--groob-purple)", fontSize: "13px", cursor: "pointer" }}>
              ← Volver al carrito
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, marginTop: 6 }}>Finalizar pedido</h1>
          </div>
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 40,
              height: 40,
              border: "3px solid #ddd6fe",
              borderTop: "3px solid #6c4dff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto"
            }} />
            <p style={{ marginTop: 12, color: "var(--groob-text-muted)", fontSize: "14px" }}>
              Cargando checkout...
            </p>
          </div>
        </div>
      </main>
    );
  }
  const shippingCost = shipping?.disponible ? (shipping.precio ?? 0) : 0;
  const total = subtotal + shippingCost;

  const displayCart = orderResult ? placedCart : items;
  const displayTotal = orderResult ? placedTotal : total;

  const handleWompiPayment = (paymentData: any) => {
    if (!(window as any).WidgetCheckout) {
      setMsg("El sistema de pago Wompi está cargando, por favor intenta en un segundo.");
      return;
    }
    
    const checkout = new (window as any).WidgetCheckout({
      currency: paymentData.currency || "COP",
      amountInCents: paymentData.amount_in_cents,
      reference: paymentData.reference,
      publicKey: paymentData.public_key,
      signature: paymentData.signature
    });
    
    checkout.open((result: any) => {
      const transaction = result.transaction;
      if (transaction) {
        console.log("Wompi transaction callback:", transaction);
        if (orderResult) {
          setOrderResult(prev => prev ? {
            ...prev,
            payment_status: transaction.status === "APPROVED" ? "PAID" : (transaction.status === "PENDING" ? "PENDING" : "FAILED"),
            status: transaction.status === "APPROVED" ? "✅ Confirmado" : prev.status
          } : null);
        }
      }
    });
  };

  function buildFallbackWaUrl(orderId: number) {
    const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim() || "-";
    const lines = [
      "Hola Groob Market 👋",
      `Quiero confirmar mi pedido #${orderId}.`,
      "",
      "Datos de entrega:",
      `- Nombre: ${fullNameCombined}`,
      `- Correo: ${email.trim() || "-"}`,
      `- Teléfono: ${phone || "-"}`,
      `- Departamento: ${department || "-"}`,
      `- Ciudad: ${city || "-"}`,
      `- Dirección: ${address || "-"}`,
      notes ? `- Notas: ${notes}` : "",
      "",
      "Productos:",
      ...displayCart.map((it) => `- ${it.qty} × ${it.name} = ${formatCOP(it.sale_price * it.qty)}`),
      "",
      `Subtotal: ${formatCOP(subtotal)}`,
      `Envío: ${shipping?.precio_fmt ?? "Por cotizar"}`,
      `Total: ${formatCOP(displayTotal)}`,
      `Método de pago: ${paymentMethod === "COD" ? "Contraentrega" : "WhatsApp"}`,
    ].filter(Boolean);
    return `https://wa.me/${DEFAULT_WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setOrderResult(null);

    if (!items.length) { setMsg("Tu carrito está vacío."); return; }
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !department.trim() ||
      !city.trim() ||
      !address.trim()
    ) {
      setMsg("Por favor, completa todos los campos obligatorios (*).");
      return;
    }

    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
      const snapshotCart = [...items];
      const snapshotTotal = total;
      const token = localStorage.getItem("groob_token");

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch(`${apiBase}/orders/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          department: department.trim(),
          city: city.trim(),
          address: address.trim(),
          notes: notes.trim(),
          payment_method: paymentMethod,
          shipping_cost: shippingCost,
          items: items.map((it) => ({ product_id: it.product_id, qty: it.qty })),
        }),
      });

      // If token expired or invalid (401), clear tokens and auto-retry as guest
      if (res.status === 401 && token) {
        console.warn("Token expired/invalid, clearing localStorage and retrying order creation as guest...");
        localStorage.removeItem("groob_token");
        localStorage.removeItem("groob_refresh");
        localStorage.removeItem("groob_user");
        window.dispatchEvent(new Event("groob_auth_update"));

        const retryHeaders: Record<string, string> = { "Content-Type": "application/json" };
        res = await fetch(`${apiBase}/orders/`, {
          method: "POST",
          headers: retryHeaders,
          body: JSON.stringify({
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim(),
            phone: phone.trim(),
            department: department.trim(),
            city: city.trim(),
            address: address.trim(),
            notes: notes.trim(),
            payment_method: paymentMethod,
            shipping_cost: shippingCost,
            items: items.map((it) => ({ product_id: it.product_id, qty: it.qty })),
          }),
        });
      }

      if (!res.ok) {
        let errorMsg = "Ocurrió un error al procesar el pedido.";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errData.message || JSON.stringify(errData);
        } catch {
          const rawText = await res.text();
          errorMsg = rawText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json() as any;

      setPlacedCart(snapshotCart);
      setPlacedTotal(snapshotTotal);
      
      const resultData = {
        id: data.id,
        status: data.status ?? "NEW",
        total: data.total ?? snapshotTotal,
        whatsapp_url: data.whatsapp_url || data.whatsapp_link || data.whatsapp || undefined,
        payment_method: data.payment_method,
        payment_status: data.payment_status,
        wompi_payment_data: data.wompi_payment_data,
      };
      
      setOrderResult(resultData);
      clearCart();
      setItems([]);
      setMsg("success");
      
      if (paymentMethod === "WOMPI" && data.wompi_payment_data) {
        let retries = 0;
        const checkAndOpen = () => {
          if ((window as any).WidgetCheckout) {
            handleWompiPayment(data.wompi_payment_data);
          } else if (retries < 15) {
            retries++;
            setTimeout(checkAndOpen, 300);
          } else {
            setMsg("El sistema de pago Wompi está tardando en cargar. Por favor, haz clic en 'Pagar Pedido con Wompi' para intentar nuevamente.");
          }
        };
        setTimeout(checkAndOpen, 300);
      }
    } catch (err: any) {
      setMsg(err?.message || "Ocurrió un error");
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
      <Script
        src="https://transaction-sandbox.wompi.co/widget.js"
        strategy="afterInteractive"
        id="wompi-widget-script-next"
      />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/cart" style={{ color: "var(--groob-purple)", fontSize: "13px", textDecoration: "none" }}>
            ← Volver al carrito
          </Link>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginTop: 6 }}>Finalizar pedido</h1>
        </div>


        {/* ── Success state ── */}
        {orderResult && (
          <div style={{
            background: orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID"
              ? "linear-gradient(135deg, #f5f3ff, #ede9fe)"
              : "linear-gradient(135deg, #d1fae5, #ecfdf5)",
            border: orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID"
              ? "1.5px solid #c084fc"
              : "1.5px solid #6ee7b7",
            borderRadius: 20, padding: "28px 32px",
            marginBottom: 28, textAlign: "center",
            boxShadow: "var(--groob-shadow-sm)",
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID" ? "💳" : "🎉"}
            </div>
            <h2 style={{
              fontSize: "22px", fontWeight: 800,
              color: orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID" ? "#5b21b6" : "#065f46",
              marginBottom: 6
            }}>
              {orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID"
                ? `¡Pedido #${orderResult.id} registrado!`
                : `¡Pedido #${orderResult.id} creado con éxito!`
              }
            </h2>
            
            {/* Error or loading message reporting inside the success card */}
            {msg && msg !== "success" && (
              <div style={{
                padding: "12px 16px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 12,
                color: "#b45309",
                fontSize: "14px",
                fontWeight: 650,
                marginBottom: 20,
                display: "inline-block",
                textAlign: "left",
                maxWidth: "100%"
              }}>
                ⚠️ {msg}
              </div>
            )}

            {orderResult.payment_method === "WOMPI" ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{
                  color: orderResult.payment_status === "PAID" ? "#047857" : "#6b21a8",
                  fontSize: "15px", fontWeight: 600
                }}>
                  Estado de pago: {" "}
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: "12px", fontWeight: 700,
                    background: orderResult.payment_status === "PAID" ? "#d1fae5" : (orderResult.payment_status === "PENDING" ? "#fef3c7" : "#fee2e2"),
                    color: orderResult.payment_status === "PAID" ? "#065f46" : (orderResult.payment_status === "PENDING" ? "#d97706" : "#b91c1c"),
                    border: `1px solid ${orderResult.payment_status === "PAID" ? "#34d399" : (orderResult.payment_status === "PENDING" ? "#fbbf24" : "#f87171")}`
                  }}>
                    {orderResult.payment_status === "PAID" ? "PAGADO" : (orderResult.payment_status === "PENDING" ? "PENDIENTE" : "FALLIDO / RECHAZADO")}
                  </span>
                </p>
                <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 8 }}>
                  Total: <strong>{formatCOP(orderResult.total)}</strong>
                </p>
              </div>
            ) : (
              <p style={{ color: "#047857", marginBottom: 20 }}>
                Estado: <strong>{orderResult.status}</strong> · Total: <strong>{formatCOP(orderResult.total)}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID" && orderResult.wompi_payment_data && (
                <button
                  onClick={() => handleWompiPayment(orderResult.wompi_payment_data)}
                  className="btn-primary"
                  style={{
                    fontSize: "15px", padding: "13px 28px",
                    background: "linear-gradient(135deg, #6c4dff, #8b5cf6)",
                    border: "none", boxShadow: "0 4px 14px rgba(108,77,255,0.4)"
                  }}
                >
                  💳 Pagar Pedido con Wompi
                </button>
              )}
              
              <a
                href={orderResult.whatsapp_url || buildFallbackWaUrl(orderResult.id)}
                target="_blank" rel="noreferrer"
                className={orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID" ? "btn-outline" : "btn-whatsapp"}
                id="btn-confirm-wa"
                style={{ fontSize: "15px", padding: "13px 28px" }}
              >
                💬 Confirmar por WhatsApp
              </a>
              <Link href="/orders" className="btn-outline" style={{ fontSize: "15px", padding: "13px 28px" }}>
                📋 Ver mis pedidos
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: "12px", color: "#6b7280" }}>
              {orderResult.payment_method === "WOMPI" && orderResult.payment_status !== "PAID"
                ? "Una vez completes tu pago, el estado se actualizará automáticamente."
                : "Te contactaremos para coordinar la entrega de tu pedido."
              }
            </p>
          </div>
        )}

        {!orderResult && (
          <div className="responsive-checkout-layout" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>

            {/* ── Delivery form ── */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--groob-border)", padding: "28px", boxShadow: "var(--groob-shadow-sm)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: 24 }}>📍 Datos de entrega</h2>

              <form onSubmit={submitOrder} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                <div className="responsive-grid-2cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="field-label">Nombres *</label>
                    <input id="inp-firstname" className="field-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ej: Andrés" required />
                  </div>
                  <div>
                    <label className="field-label">Apellidos *</label>
                    <input id="inp-lastname" className="field-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ej: Inciarte" required />
                  </div>
                </div>

                <div className="responsive-grid-2cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="field-label">Correo electrónico *</label>
                    <input id="inp-email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ej: andres@gmail.com" required />
                  </div>
                  <div>
                    <label className="field-label">Teléfono / WhatsApp *</label>
                    <input id="inp-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 3001805448" required />
                  </div>
                </div>

                <div>
                  <ColombiaShipping
                    department={department}
                    city={city}
                    onDepartmentChange={setDepartment}
                    onCityChange={setCity}
                  />
                </div>

                {/* ── Shipping quote box ── */}
                <div style={{
                  borderRadius: 14, padding: "14px 16px",
                  border: `1.5px solid ${shipping?.disponible ? "rgba(108,77,255,0.2)" : "#e2e8f0"}`,
                  background: shipping?.disponible
                    ? "linear-gradient(135deg, #f5f3ff, #ede9fe)"
                    : "#f8fafc",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#6c4dff", marginBottom: 8 }}>
                    🚚 Costo de envío
                  </p>

                  {shippingLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 14, height: 14, border: "2px solid #ddd6fe", borderTop: "2px solid #6c4dff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      <span style={{ fontSize: 12, color: "#64748b" }}>Calculando envío...</span>
                    </div>
                  )}

                  {!shippingLoading && city === "Otra ciudad (consultar)" && (
                    <div>
                      <p style={{ fontSize: 12, color: "#92400e", marginBottom: 8 }}>
                        ⚠️ Para ciudades fuera de nuestra cobertura estándar, cotiza directamente por WhatsApp.
                      </p>
                      <a
                        href={`https://wa.me/${DEFAULT_WA_NUMBER}?text=${encodeURIComponent("Hola, quiero cotizar envío a mi ciudad 📦")}`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: 13, color: "#25d366", fontWeight: 700, textDecoration: "none" }}
                      >
                        💬 Cotizar por WhatsApp →
                      </a>
                    </div>
                  )}

                  {!shippingLoading && shipping && shipping.disponible && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                          📍 {shipping.zona_label?.split("—")?.[1]?.trim() || shipping.zona_label || ""}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          ⏱ Tiempo estimado: {shipping.tiempo}
                        </p>
                      </div>
                      <p style={{ fontSize: 22, fontWeight: 900, color: "#6c4dff" }}>
                        {shipping.precio_fmt}
                      </p>
                    </div>
                  )}

                  {!shippingLoading && shipping && !shipping.disponible && city !== "Otra ciudad (consultar)" && (
                    <div>
                      <p style={{ fontSize: 12, color: "#92400e", marginBottom: 6 }}>
                        ⚠️ {shipping.mensaje || "No tenemos tarifa automática para esta ciudad."}
                      </p>
                      {shipping.whatsapp_url && (
                        <a href={shipping.whatsapp_url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 13, color: "#25d366", fontWeight: 700, textDecoration: "none" }}>
                          💬 Cotizar por WhatsApp →
                        </a>
                      )}
                    </div>
                  )}
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
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { value: "COD", label: "💵 Contraentrega" },
                      { value: "WHATSAPP", label: "💬 WhatsApp" },
                      { value: "WOMPI", label: "💳 Pago en línea (Wompi)" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value as any)}
                        id={`pay-${opt.value.toLowerCase()}`}
                        style={{
                          flex: "1 1 180px", padding: "12px", borderRadius: 12,
                          border: `2px solid ${paymentMethod === opt.value ? "var(--groob-purple)" : "var(--groob-border)"}`,
                          background: paymentMethod === opt.value ? "var(--groob-purple-bg)" : "white",
                          color: paymentMethod === opt.value ? "var(--groob-purple)" : "var(--groob-text-muted)",
                          fontWeight: 600, fontSize: "14px", cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explicación de canal / banco del medio de pago */}
                <div style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid var(--groob-border2)",
                  background: "#f8fafc",
                  fontSize: "13px",
                  color: "var(--groob-text-2)",
                  lineHeight: "1.45"
                }}>
                  {paymentMethod === "COD" && (
                    <p>
                      <strong>💵 Pago Contraentrega:</strong> Pagas en efectivo o transferencia (Nequi, Bancolombia) cuando el domiciliario te entregue el producto. Cobertura en el Valle de Aburrá.
                    </p>
                  )}
                  {paymentMethod === "WHATSAPP" && (
                    <p>
                      <strong>💬 Pedido por WhatsApp:</strong> Te enviaremos a nuestro canal oficial de WhatsApp con tu resumen de compra para coordinar el pago por transferencia directa o acordar los detalles de entrega.
                    </p>
                  )}
                  {paymentMethod === "WOMPI" && (
                    <div>
                      <p style={{ marginBottom: 8, fontWeight: 700, color: "var(--groob-text)" }}>
                        <strong>💳 Pago en línea seguro (Wompi):</strong> Podrás seleccionar tu medio de pago favorito:
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ background: "rgba(108,77,255,0.08)", color: "var(--groob-purple)", padding: "4px 8px", borderRadius: 8, fontSize: "11px", fontWeight: 700 }}>⚡ PSE (Cualquier Banco)</span>
                        <span style={{ background: "rgba(108,77,255,0.08)", color: "var(--groob-purple)", padding: "4px 8px", borderRadius: 8, fontSize: "11px", fontWeight: 700 }}>📱 Nequi</span>
                        <span style={{ background: "rgba(108,77,255,0.08)", color: "var(--groob-purple)", padding: "4px 8px", borderRadius: 8, fontSize: "11px", fontWeight: 700 }}>💳 Tarjetas Débito / Crédito</span>
                        <span style={{ background: "rgba(108,77,255,0.08)", color: "var(--groob-purple)", padding: "4px 8px", borderRadius: 8, fontSize: "11px", fontWeight: 700 }}>🏦 Botón Bancolombia</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--groob-text-muted)" }}>
                        * La selección del banco o cuenta de Nequi se realiza en la siguiente pantalla segura de Wompi.
                      </p>
                    </div>
                  )}
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
                  {loading ? "Creando pedido..." : 
                    paymentMethod === "WOMPI" ? "💳 Pagar seguro con Wompi" :
                    paymentMethod === "WHATSAPP" ? "💬 Confirmar y pedir por WhatsApp" :
                    "💵 Confirmar pedido (Contraentrega)"
                  }
                </button>
              </form>
            </div>

            {/* ── Order Summary ── */}
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
                <span style={{ fontWeight: 600 }}>{formatCOP(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: "14px" }}>
                <span style={{ color: "var(--groob-text-muted)" }}>Domicilio</span>
                <span style={{ fontWeight: 700, color: shipping?.disponible ? "#0f172a" : "#94a3b8" }}>
                  {shippingLoading
                    ? "Calculando..."
                    : shipping?.disponible
                      ? shipping.precio_fmt ?? "Incluido"
                      : city === "Otra ciudad (consultar)" ? "Por cotizar" : "No disponible"}
                </span>
              </div>

              <div style={{
                background: "linear-gradient(135deg, var(--groob-purple-bg), #fff)",
                borderRadius: 12, padding: "14px 16px",
                border: "1px solid rgba(108,77,255,0.15)",
              }}>
                <p style={{ fontSize: "12px", color: "var(--groob-text-muted)" }}>Total a pagar</p>
                <p style={{ fontSize: "28px", fontWeight: 900, color: "var(--groob-text)" }}>{formatCOP(total)}</p>
              </div>

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {["📍 Cobertura Valle de Aburrá y Antioquia", "🔒 Datos protegidos", "✅ Pago contraentrega disponible"].map((t) => (
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

export default function CheckoutPage() {
  return (
    <ErrorBoundary>
      <CheckoutPageInner />
    </ErrorBoundary>
  );
}