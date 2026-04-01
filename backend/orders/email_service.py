"""
Groob Market — Email Service
Usa Resend SMTP para enviar notificaciones de pedidos.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Paleta de colores por estado ────────────────────────────────────────────
STATUS_META = {
    "order_created": {
        "emoji": "🛍️", "color": "#6c4dff",
        "title": "¡Tu pedido fue recibido!",
        "subtitle": "Lo estamos procesando ahora mismo.",
        "body": "Hemos recibido tu pedido y nuestro equipo lo está revisando. Te notificaremos en cada etapa.",
        "badge_bg": "#f5f3ff", "badge_color": "#6c4dff", "badge_text": "PEDIDO RECIBIDO",
    },
    "order_confirmed": {
        "emoji": "✅", "color": "#059669",
        "title": "¡Pedido confirmado!",
        "subtitle": "Ya comenzamos a preparar tu pedido.",
        "body": "Tu pedido ha sido confirmado y ya estamos preparándolo con mucho cuidado.",
        "badge_bg": "#ecfdf5", "badge_color": "#059669", "badge_text": "CONFIRMADO",
    },
    "order_packing": {
        "emoji": "📦", "color": "#d97706",
        "title": "¡Empacando con amor!",
        "subtitle": "Estamos empacando tu pedido.",
        "body": "Tu pedido está siendo empacado. En breve estará listo para salir a buscarte.",
        "badge_bg": "#fffbeb", "badge_color": "#d97706", "badge_text": "EMPACANDO",
    },
    "order_on_the_way": {
        "emoji": "🛵", "color": "#2563eb",
        "title": "¡Tu pedido va en camino!",
        "subtitle": "El domiciliario está en ruta hacia ti.",
        "body": "Nuestro domiciliario ya salió con tu pedido. Estará llegando pronto.",
        "badge_bg": "#eff6ff", "badge_color": "#2563eb", "badge_text": "EN CAMINO",
    },
    "order_logistics": {
        "emoji": "🚚", "color": "#7c3aed",
        "title": "¡En manos de la empresa logística!",
        "subtitle": "Coordinamos el envío a tu ciudad.",
        "body": "Tu pedido fue entregado a la empresa de transporte. Recibirás el número de guía pronto.",
        "badge_bg": "#f5f3ff", "badge_color": "#7c3aed", "badge_text": "CON LOGÍSTICA",
    },
    "order_delivered": {
        "emoji": "🎉", "color": "#059669",
        "title": "¡Pedido entregado! 🎊",
        "subtitle": "Esperamos que lo disfrutes mucho.",
        "body": "Tu pedido fue entregado exitosamente. ¡Gracias por comprar en Groob Market! Si tienes algún inconveniente, escríbenos. 💜",
        "badge_bg": "#ecfdf5", "badge_color": "#059669", "badge_text": "ENTREGADO",
    },
    "order_canceled": {
        "emoji": "❌", "color": "#dc2626",
        "title": "Pedido cancelado",
        "subtitle": "Lo sentimos mucho.",
        "body": "Tu pedido fue cancelado. Si crees que es un error o necesitas ayuda, contáctanos por WhatsApp.",
        "badge_bg": "#fef2f2", "badge_color": "#dc2626", "badge_text": "CANCELADO",
    },
}


def _format_cop(value: int) -> str:
    return f"${value:,.0f}".replace(",", ".")


def _build_invoice_rows(order) -> str:
    rows = ""
    for item in order.items.all():
        rows += f"""
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;">
            {item.product_name or item.product.name}
            <br><small style="color:#94a3b8">SKU: {item.product_sku or ''}</small>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;">{item.qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;">{_format_cop(item.unit_price)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:700;">{_format_cop(item.line_subtotal)}</td>
        </tr>"""
    return rows


def _build_status_timeline(current_status: str) -> str:
    steps = [
        ("NEW",        "🆕", "Recibido"),
        ("CONFIRMED",  "✅", "Confirmado"),
        ("PACKING",    "📦", "Empacando"),
        ("ON_THE_WAY", "🛵", "En camino"),
        ("DELIVERED",  "🎉", "Entregado"),
    ]
    statuses = [s[0] for s in steps]
    try:
        current_idx = statuses.index(current_status)
    except ValueError:
        current_idx = 0

    html = '<div style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;margin:20px 0;">'
    for i, (status, emoji, label) in enumerate(steps):
        is_done = i <= current_idx
        is_current = i == current_idx
        color = "#6c4dff" if is_current else ("#22c55e" if is_done else "#e2e8f0")
        text_color = "#fff" if (is_done or is_current) else "#94a3b8"
        html += f"""
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="width:36px;height:36px;border-radius:50%;background:{color};
               display:flex;align-items:center;justify-content:center;font-size:16px;
               box-shadow:{'0 0 0 3px rgba(108,77,255,0.3)' if is_current else 'none'}">
            {emoji if is_done else '○'}
          </div>
          <span style="font-size:10px;font-weight:600;color:{'#6c4dff' if is_current else ('#22c55e' if is_done else '#94a3b8')}">{label}</span>
        </div>"""
        if i < len(steps) - 1:
            line_color = "#22c55e" if i < current_idx else "#e2e8f0"
            html += f'<div style="flex:1;min-width:16px;height:2px;background:{line_color};margin-bottom:20px;"></div>'
    html += "</div>"
    return html


def build_email_html(order, event_key: str) -> str:
    meta = STATUS_META.get(event_key, STATUS_META["order_created"])
    invoice_rows = _build_invoice_rows(order)
    timeline = _build_status_timeline(order.status)
    whatsapp_url = f"https://wa.me/{getattr(settings, 'WHATSAPP_NUMBER', '573011963515')}"
    site_url = getattr(settings, "SITE_URL", "http://localhost:3000")
    order_url = f"{site_url}/orders"
    year = 2025

    coupon_row = ""
    if order.coupon_code and order.discount_total > 0:
        coupon_row = f"""
        <div style="display:flex;justify-content:space-between;padding:6px 0;color:#059669;">
          <span>🎁 Cupón <strong>{order.coupon_code}</strong> (-{order.coupon_discount}%)</span>
          <strong>-{_format_cop(order.discount_total)}</strong>
        </div>"""

    tracking_html = ""
    if order.tracking_number:
        tracking_html = f"""
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px 16px;margin:16px 0;">
          <p style="font-weight:700;color:#166534;font-size:13px;margin:0 0 4px;">🔍 Número de guía</p>
          <p style="font-size:18px;font-weight:900;color:#166534;letter-spacing:0.05em;">{order.tracking_number}</p>
          <p style="font-size:11px;color:#166534;margin-top:4px;">Empresa: {order.get_logistics_company_display()}</p>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{meta['title']} — Groob Market</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6c4dff 0%,#9b8cff 100%);border-radius:20px 20px 0 0;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <h1 style="color:white;font-size:22px;font-weight:900;margin:0;">Groob Market</h1>
        <p style="color:rgba(255,255,255,0.75);font-size:12px;margin:3px 0 0;">Vitrina Virtual · Medellín</p>
      </div>
      <div style="background:rgba(255,255,255,0.95);border-radius:12px;padding:8px 16px;text-align:center;">
        <p style="font-size:10px;color:#6c4dff;font-weight:700;margin:0;">PEDIDO</p>
        <p style="font-size:16px;font-weight:900;color:#0f172a;margin:2px 0 0;">{order.order_number}</p>
      </div>
    </div>

    <!-- Status Card -->
    <div style="background:white;padding:28px 32px;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:52px;margin-bottom:10px;">{meta['emoji']}</div>
        <span style="background:{meta['badge_bg']};color:{meta['badge_color']};padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.05em;">{meta['badge_text']}</span>
        <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:12px 0 6px;">{meta['title']}</h2>
        <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0;">{meta['body']}</p>
      </div>

      <!-- Timeline -->
      {timeline}

      {tracking_html}
    </div>

    <!-- Order Details -->
    <div style="background:white;padding:24px 32px;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;border-top:1px solid #f1f5f9;">
      <h3 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 16px;">📋 Detalle del pedido</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;text-align:left;font-size:11px;color:#64748b;font-weight:700;">PRODUCTO</th>
            <th style="padding:8px;text-align:center;font-size:11px;color:#64748b;font-weight:700;">CANT.</th>
            <th style="padding:8px;text-align:right;font-size:11px;color:#64748b;font-weight:700;">P/U</th>
            <th style="padding:8px;text-align:right;font-size:11px;color:#64748b;font-weight:700;">TOTAL</th>
          </tr>
        </thead>
        <tbody>{invoice_rows}</tbody>
      </table>

      <!-- Totals -->
      <div style="border-top:2px solid #f1f5f9;margin-top:12px;padding-top:12px;">
        <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;">
          <span style="color:#64748b;">Subtotal</span><strong>{_format_cop(order.subtotal)}</strong>
        </div>
        {coupon_row}
        <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;">
          <span style="color:#64748b;">Envío</span>
          <span style="color:#22c55e;font-weight:600;">{'Gratis (Mismo día)' if order.shipping_cost == 0 else _format_cop(order.shipping_cost)}</span>
        </div>
        <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:12px;padding:12px 16px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:800;font-size:16px;">TOTAL</span>
          <span style="font-weight:900;font-size:24px;color:#6c4dff;">{_format_cop(order.total)}</span>
        </div>
      </div>
    </div>

    <!-- Delivery Info -->
    <div style="background:white;padding:24px 32px;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;border-top:1px solid #f8fafc;">
      <h3 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 14px;">📍 Datos de entrega</h3>
      <div style="display:grid;gap:8px;font-size:13px;">
        <div><span style="color:#64748b;">👤 Nombre:</span> <strong>{order.full_name}</strong></div>
        <div><span style="color:#64748b;">📱 Tel:</span> <strong>{order.phone}</strong></div>
        <div><span style="color:#64748b;">📧 Email:</span> <strong>{order.email}</strong></div>
        <div><span style="color:#64748b;">🏠 Dirección:</span> <strong>{order.address}{(' — ' + order.address2) if order.address2 else ''}</strong></div>
        <div><span style="color:#64748b;">🌆 Ciudad:</span> <strong>{order.city}, {order.department}</strong></div>
        {'<div><span style="color:#64748b;">📝 Notas:</span> ' + order.notes + '</div>' if order.notes else ''}
      </div>
    </div>

    <!-- CTA -->
    <div style="background:white;padding:20px 32px 28px;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;border-top:1px solid #f8fafc;border-radius:0 0 20px 20px;text-align:center;">
      <a href="{order_url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6c4dff,#9b8cff);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;margin-bottom:12px;">
        📋 Ver mi pedido en línea
      </a>
      <p style="font-size:12px;color:#94a3b8;margin:0;">
        ¿Preguntas? <a href="{whatsapp_url}" style="color:#6c4dff;font-weight:600;">WhatsApp: 301 196 3515</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;font-size:11px;color:#94a3b8;">
      <p style="margin:0;">© {year} Groob Market · Medellín, Colombia</p>
      <p style="margin:4px 0 0;">Este correo fue generado automáticamente. Por favor no lo respondas.</p>
    </div>
  </div>
</body>
</html>"""


def send_order_email(order, event_key: str) -> bool:
    """
    Envía email de notificación del pedido usando Resend SMTP.
    Retorna True si fue enviado correctamente.
    """
    if not order.email:
        logger.warning(f"Pedido #{order.id} sin email — no se envió notificación.")
        return False

    meta = STATUS_META.get(event_key, STATUS_META["order_created"])
    subject = f"{meta['emoji']} {meta['title']} — {order.order_number} | Groob Market"

    plain = f"""
{meta['title']}
{order.order_number}

{meta['body']}

📦 Productos: {order.items.count()} artículo(s)
💰 Total: ${order.total:,.0f} COP
📍 Ciudad: {order.city}, {order.department}

Ver tu pedido: {getattr(settings, 'SITE_URL', 'http://localhost:3000')}/orders
Soporte WhatsApp: +57 301 196 3515
"""

    try:
        html = build_email_html(order, event_key)
        send_mail(
            subject=subject,
            message=plain,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev"),
            recipient_list=[order.email],
            html_message=html,
            fail_silently=False,
        )
        logger.info(f"✉️ Email '{event_key}' enviado a {order.email} (Pedido #{order.id})")
        return True
    except Exception as e:
        logger.error(f"❌ Error enviando email '{event_key}' a {order.email}: {e}")
        return False
