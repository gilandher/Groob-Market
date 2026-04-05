from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem


class ItemsPedidoInline(admin.TabularInline):
    """
    Muestra los productos del pedido directamente dentro de la orden.
    El operador puede ver qué pidió el cliente sin salir de la pantalla.
    """
    model = OrderItem
    extra = 0
    verbose_name = "Producto del pedido"
    verbose_name_plural = "Productos del pedido"
    readonly_fields = ("product", "qty", "unit_price", "unit_cost", "line_subtotal")

    def has_add_permission(self, request, obj=None):
        return False  # No permitir agregar ítems manualmente desde el admin


@admin.register(Order)
class AdminPedido(admin.ModelAdmin):
    """
    Admin de pedidos — Panel principal para el operador.

    Desde aquí el operador puede:
    - Ver todos los pedidos con su estado actual
    - Filtrar por estado, método de pago, fecha
    - Cambiar el estado del pedido (ej: CONFIRMADO → EN RUTA → ENTREGADO)
    - Ver los productos que pidió cada cliente
    """
    list_display = (
        "id",
        "nombre_cliente",
        "telefono",
        "estado_color",
        "metodo_pago",
        "estado_pago",
        "total_cop",
        "fecha_pedido",
        "ver_detalle_btn",
    )
    list_filter = ("status", "payment_method", "payment_status", "created_at")
    search_fields = ("full_name", "phone", "address", "city")
    ordering = ("-created_at",)
    inlines = [ItemsPedidoInline]
    readonly_fields = ("subtotal", "discount_total", "shipping_cost", "total", "created_at")

    # Agrupación de campos en el detalle del pedido
    fieldsets = (
        ("📦 Estado del pedido", {
            "fields": ("status", "payment_method", "payment_status")
        }),
        ("👤 Datos del cliente", {
            "fields": ("full_name", "phone", "city", "address", "notes")
        }),
        ("💰 Totales", {
            "fields": ("subtotal", "shipping_cost", "discount_total", "total")
        }),
        ("🕐 Fechas", {
            "fields": ("created_at",)
        }),
    )

    # ── Columnas personalizadas ───────────────────────────────────────────────

    @admin.display(description="Cliente")
    def nombre_cliente(self, obj):
        return obj.full_name

    @admin.display(description="Teléfono")
    def telefono(self, obj):
        return obj.phone

    @admin.display(description="Estado")
    def estado_color(self, obj):
        """Muestra el estado del pedido con colores para identificar rápido."""
        colores = {
            "NEW":                  ("#6B7280", "🆕 Nuevo"),
            "AWAITING_CONFIRMATION": ("#F59E0B", "⏳ Esperando confirmación"),
            "CONFIRMED":            ("#3B82F6", "✅ Confirmado"),
            "PACKING":              ("#8B5CF6", "📦 Empacando"),
            "READY_FOR_DISPATCH":   ("#F97316", "🚀 Listo para despacho"),
            "DISPATCHED":           ("#06B6D4", "🚚 En ruta"),
            "DELIVERED":            ("#16A34A", "✔️ Entregado"),
            "CANCELED":             ("#DC2626", "❌ Cancelado"),
        }
        color, etiqueta = colores.get(obj.status, ("#6B7280", obj.status))
        return format_html('<b style="color:{};">{}</b>', color, etiqueta)

    @admin.display(description="Método de pago")
    def metodo_pago(self, obj):
        etiquetas = {
            "COD":      "💵 Contraentrega",
            "WHATSAPP": "💬 WhatsApp",
            "PAYU":     "💳 PayU",
            "WOMPI":    "💳 Wompi",
        }
        return etiquetas.get(obj.payment_method, obj.payment_method)

    @admin.display(description="Estado pago")
    def estado_pago(self, obj):
        etiquetas = {
            "PENDING":       "⏳ Pendiente",
            "COD_PENDING":   "⏳ COD pendiente",
            "COD_COLLECTED": "✅ COD cobrado",
            "INITIATED":     "🔄 Iniciado",
            "PAID":          "✅ Pagado",
            "FAILED":        "❌ Fallido",
        }
        return etiquetas.get(obj.payment_status, obj.payment_status)

    @admin.display(description="Total")
    def total_cop(self, obj):
        return f"$ {obj.total:,}".replace(",", ".")

    @admin.display(description="Fecha pedido")
    def fecha_pedido(self, obj):
        return obj.created_at.strftime("%d/%m/%Y %H:%M")

    @admin.display(description="Acciones")
    def ver_detalle_btn(self, obj):
        """Botón UX para inspeccionar rápidamente la compra tipo factura"""
        return format_html(
            '<a class="btn btn-sm" href="{}/change/" '
            'style="background-color: #6c4dff; color: white; border-radius: 5px; font-weight: bold;">'
            '<i class="fas fa-eye"></i> Inspeccionar</a>',
            obj.id
        )