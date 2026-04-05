from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from catalog.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        NEW          = "NEW",          "🆕 Pedido Realizado"
        CONFIRMED    = "CONFIRMED",    "✅ Confirmado"
        PACKING      = "PACKING",      "📦 Empacando con amor"
        ON_THE_WAY   = "ON_THE_WAY",   "🛵 En camino a ti"
        LOGISTICS    = "LOGISTICS",    "🚚 En manos de la empresa logística"
        DELIVERED    = "DELIVERED",    "🎉 Entregado con éxito"
        CANCELED     = "CANCELED",     "❌ Cancelado"

    class PaymentMethod(models.TextChoices):
        COD      = "COD",      "Contraentrega"
        WHATSAPP = "WHATSAPP", "WhatsApp"
        PAYU     = "PAYU",     "PayU"
        WOMPI    = "WOMPI",    "Wompi"

    class PaymentStatus(models.TextChoices):
        PENDING       = "PENDING",       "Pendiente"
        COD_PENDING   = "COD_PENDING",   "COD pendiente"
        COD_COLLECTED = "COD_COLLECTED", "COD cobrado"
        PAID          = "PAID",          "Pagado"
        FAILED        = "FAILED",        "Fallido"

    class LogisticsCompany(models.TextChoices):
        OWN           = "OWN",           "Propio (Valle de Aburrá)"
        COORDINADORA  = "COORDINADORA",  "Coordinadora"
        ENVIA         = "ENVIA",         "Envía"
        SERVIENTREGA  = "SERVIENTREGA",  "Servientrega"
        INTERRAPIDISIMO = "INTERRAPIDISIMO", "Interrapidísimo"

    # ─ Relación con usuario ─────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        null=True, blank=True,
        verbose_name="Usuario"
    )

    # ─ Estado y pago ────────────────────────────────────────────────────────
    status = models.CharField(
        "Estado", max_length=30,
        choices=Status.choices, default=Status.NEW
    )
    payment_method = models.CharField(
        "Método de pago", max_length=20,
        choices=PaymentMethod.choices, default=PaymentMethod.COD
    )
    payment_status = models.CharField(
        "Estado del pago", max_length=20,
        choices=PaymentStatus.choices, default=PaymentStatus.COD_PENDING
    )

    # ─ Datos de entrega ─────────────────────────────────────────────────────
    full_name    = models.CharField("Nombre completo",      max_length=120)
    email        = models.EmailField("Correo electrónico",  default="")
    phone        = models.CharField("Teléfono / WhatsApp",  max_length=30)
    department   = models.CharField("Departamento",         max_length=80,  default="Antioquia")
    city         = models.CharField("Ciudad o municipio",   max_length=80,  default="Medellín")
    address      = models.CharField("Dirección principal",  max_length=200)
    address2     = models.CharField("Dirección secundaria / Apto / Piso", max_length=200, blank=True, default="")
    notes        = models.CharField("Instrucciones adicionales", max_length=300, blank=True, default="")
    location_lat = models.DecimalField("Latitud GPS",  max_digits=10, decimal_places=7, null=True, blank=True)
    location_lng = models.DecimalField("Longitud GPS", max_digits=10, decimal_places=7, null=True, blank=True)

    # ─ Logística ────────────────────────────────────────────────────────────
    logistics_company = models.CharField(
        "Empresa logística", max_length=30,
        choices=LogisticsCompany.choices, default=LogisticsCompany.OWN
    )
    tracking_number   = models.CharField("Número de guía", max_length=100, blank=True, default="")

    # ─ Cupón ────────────────────────────────────────────────────────────────
    coupon_code      = models.CharField("Código de cupón", max_length=40, blank=True, default="")
    coupon_discount  = models.PositiveIntegerField("% descuento cupón", default=0)

    # ─ Totales ──────────────────────────────────────────────────────────────
    subtotal       = models.PositiveIntegerField("Subtotal (COP)", default=0)
    discount_total = models.PositiveIntegerField("Descuento (COP)", default=0)
    shipping_cost  = models.PositiveIntegerField("Costo envío (COP)", default=0)
    total          = models.PositiveIntegerField("Total (COP)", default=0)

    # ─ Timestamps ───────────────────────────────────────────────────────────
    created_at  = models.DateTimeField("Fecha del pedido",  auto_now_add=True)
    updated_at  = models.DateTimeField("Última actualización", auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pedido #{self.id} — {self.get_status_display()} — {self.full_name}"

    @property
    def order_number(self):
        return f"GM-{self.id:06d}"

    def get_status_emoji(self):
        emojis = {
            "NEW": "🆕", "CONFIRMED": "✅", "PACKING": "📦",
            "ON_THE_WAY": "🛵", "LOGISTICS": "🚚",
            "DELIVERED": "🎉", "CANCELED": "❌"
        }
        return emojis.get(self.status, "📋")

    def is_same_day_delivery(self):
        """Valle de Aburrá = entrega el mismo día."""
        same_day_cities = [
            "medellín", "medellin", "bello", "itagüí", "itagui",
            "envigado", "sabaneta", "la estrella", "caldas",
            "copacabana", "girardota", "barbosa"
        ]
        return self.city.lower() in same_day_cities


class OrderItem(models.Model):
    order        = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product      = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty          = models.PositiveIntegerField("Cantidad", default=1)
    unit_price   = models.PositiveIntegerField("Precio unitario (COP)")
    unit_cost    = models.PositiveIntegerField("Costo unitario (COP)", default=0)
    line_subtotal = models.PositiveIntegerField("Subtotal línea (COP)", default=0)
    product_name = models.CharField("Nombre del producto (snapshot)", max_length=200, default="")
    product_sku  = models.CharField("SKU (snapshot)", max_length=80, default="")

    class Meta:
        verbose_name = "Ítem del pedido"
        verbose_name_plural = "Ítems del pedido"

    def __str__(self):
        return f"{self.qty} × {self.product_name or self.product.name}"


# ─── Signal: notificación automática por email al cambiar estado ──────────────
@receiver(post_save, sender=Order)
def notify_status_change(sender, instance: Order, created: bool, **kwargs):
    """
    Envía email al cliente automáticamente cuando el estado del pedido cambia.
    """
    from orders.email_service import send_order_email
    if created:
        send_order_email(instance, "order_created")
    else:
        # Solo enviamos en cambios de estado relevantes
        relevant = {"CONFIRMED", "PACKING", "ON_THE_WAY", "LOGISTICS", "DELIVERED", "CANCELED"}
        if instance.status in relevant:
            send_order_email(instance, f"order_{instance.status.lower()}")