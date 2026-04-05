// ─── Groob Market — PDF Generator ───────────────────────────────────────────
// Genera prefactura y factura usando la API nativa window.print()
// Sin dependencias externas (no jsPDF, no canvg) → 100% compatible con Turbopack
// El usuario verá el diálogo de impresión del navegador y puede guardar como PDF.

export interface OrderForPDF {
  id: number;
  order_number: string;
  status: string;
  full_name: string;
  email: string;
  phone?: string;
  city: string;
  department: string;
  address: string;
  created_at: string;
  items: { product_name: string; qty: number; unit_price: number; line_subtotal: number }[];
  subtotal: number;
  discount_total: number;
  shipping_cost: number;
  total: number;
  coupon_code?: string;
  coupon_discount?: number;
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Bogota",
  });
}

export function generateOrderPDF(order: OrderForPDF, type: "prefactura" | "factura"): void {
  const isPre = type === "prefactura";
  const docTitle = isPre ? "PRE-FACTURA" : "FACTURA";
  const today = new Date().toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Bogota",
  });

  const itemsRows = order.items.map(it => `
    <tr>
      <td>${it.product_name}</td>
      <td class="center">${it.qty}</td>
      <td class="right">${formatCOP(it.unit_price)}</td>
      <td class="right">${formatCOP(it.line_subtotal)}</td>
    </tr>
  `).join("");

  const discountRow = order.discount_total > 0 ? `
    <tr class="muted-row">
      <td colspan="3">Descuento${order.coupon_code ? ` (${order.coupon_code})` : ""}</td>
      <td class="right" style="color:#ef4444;">-${formatCOP(order.discount_total)}</td>
    </tr>
  ` : "";

  const legalText = isPre
    ? `<p>Este documento es una <strong>pre-factura provisional</strong> y no tiene validez fiscal hasta la confirmación y entrega del pedido.</p>
       <p>El precio puede estar sujeto a verificación de disponibilidad de stock.</p>
       <p>Groob Market atiende garantías conforme a la <strong>LEY 1480 de 2011</strong> (Estatuto del Consumidor).</p>
       <p>Celulares nuevos: 1 año · Accesorios: 3 meses · Usados/outlet: 3 meses · Tecnología general: 45 días.</p>`
    : `<p>La garantía cubre fallas de funcionamiento, defectos de fabricación y problemas de idoneidad presentados bajo condiciones normales de uso.</p>
       <p>Celulares nuevos: 1 año · Accesorios: 3 meses · Usados/outlet: 3 meses.</p>
       <p>Para efectivizar la garantía, presente este documento junto con el producto. <strong>No cubre</strong>: golpes, caídas, humedad, daño físico accidental.</p>
       <p>Marco normativo: Ley 1480/2011, Decreto 735/2013, Decreto 1581/2012, Decreto 1074/2015.</p>
       <p style="color:#b91c1c;font-style:italic;">"Autorizo a Groob Market para recolectar y tratar mis datos personales con el fin de gestionar mi registro, compras, facturación, envíos, garantías, soporte y comunicaciones relacionadas."</p>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} #${order.order_number} — Groob Market</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
    
    /* Header */
    .header { background: linear-gradient(135deg, #6c4dff, #9b8cff); color: #fff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .brand-name { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; opacity: 0.8; margin-top: 4px; }
    .doc-badge { background: #fff; color: #6c4dff; border-radius: 10px; padding: 8px 20px; text-align: center; }
    .doc-badge h2 { font-size: 16px; font-weight: 900; }
    .doc-badge p { font-size: 9px; color: #64748b; margin-top: 2px; }

    /* Info section */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
    .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6c4dff; font-weight: 700; margin-bottom: 8px; }
    .info-block p { font-size: 12px; color: #374151; line-height: 1.8; }
    .info-block strong { color: #0f172a; }

    /* Table */
    .table-wrap { padding: 0 32px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    thead th { background: #6c4dff; color: #fff; padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .center { text-align: center; }
    .right { text-align: right; }
    .muted-row td { color: #64748b; font-size: 11px; }

    /* Totals */
    .totals { display: flex; flex-direction: column; align-items: flex-end; padding: 8px 32px 16px; gap: 4px; }
    .total-row { display: flex; gap: 48px; font-size: 12px; color: #374151; }
    .total-row.grand { font-size: 16px; font-weight: 900; color: #6c4dff; margin-top: 6px; padding-top: 8px; border-top: 2px solid #e2e8f0; }
    .total-row span:last-child { min-width: 100px; text-align: right; }

    /* Legal */
    .legal { margin: 16px 32px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 16px 20px; }
    .legal h4 { color: #6c4dff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .legal p { font-size: 10px; color: #475569; line-height: 1.7; margin-bottom: 4px; }

    /* Footer */
    .footer { background: #6c4dff; color: #fff; text-align: center; padding: 10px; font-size: 10px; margin-top: 24px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand-name">GROOB MARKET</div>
      <div class="brand-sub">Vitrina Virtual · Medellín, Colombia · 📞 301 196 3515</div>
    </div>
    <div class="doc-badge">
      <h2>${docTitle}</h2>
      <p>${isPre ? "Sujeto a confirmación" : "Documento de venta"}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h3>📋 Datos del Pedido</h3>
      <p><strong>N° Pedido:</strong> ${order.order_number}</p>
      <p><strong>Fecha pedido:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Fecha emisión:</strong> ${today}</p>
    </div>
    <div class="info-block">
      <h3>👤 Cliente</h3>
      <p><strong>${order.full_name}</strong></p>
      <p>${order.email}</p>
      ${order.phone ? `<p>${order.phone}</p>` : ""}
      <p>${order.city}, ${order.department}</p>
      <p>${order.address}</p>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="center">Cant.</th>
          <th class="right">P. Unitario</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatCOP(order.subtotal)}</span></div>
    ${order.discount_total > 0 ? `<div class="total-row" style="color:#ef4444;"><span>Descuento${order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>-${formatCOP(order.discount_total)}</span></div>` : ""}
    <div class="total-row"><span>Envío</span><span>${order.shipping_cost === 0 ? "✅ Gratis" : formatCOP(order.shipping_cost)}</span></div>
    <div class="total-row grand"><span>TOTAL</span><span>${formatCOP(order.total)}</span></div>
  </div>

  <div class="legal">
    <h4>📄 Términos y Condiciones</h4>
    ${legalText}
  </div>

  <div class="footer">
    © ${new Date().getFullYear()} Groob Market · Hecho con ❤️ en Medellín, Colombia · groobmarket.com
  </div>

  <script>
    window.onload = function() {
      window.print();
      // Cierra la pestaña después de imprimir/guardar
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

  // Abre en nueva pestaña → el navegador muestra diálogo "Guardar como PDF"
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    // Liberar el objectURL cuando se cierre la ventana
    win.addEventListener("unload", () => URL.revokeObjectURL(url));
  } else {
    // Fallback: descarga directa del HTML (navegadores que bloquean popups)
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle}_${order.order_number}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
