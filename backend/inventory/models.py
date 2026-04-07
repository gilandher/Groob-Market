from django.db import models
from django.contrib.auth import get_user_model
from catalog.models import Product

User = get_user_model()


class InventoryMovement(models.Model):
    """
    Movimientos de inventario:
    - IN: entrada (compras al mayorista)
    - OUT: salida (ventas)
    - ADJUST: ajuste (inventario físico)
    """

    class Type(models.TextChoices):
        IN = "IN", "Entrada"
        OUT = "OUT", "Salida"
        ADJUST = "ADJUST", "Ajuste"

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="movements",
        verbose_name="Producto",
    )

    movement_type = models.CharField("Tipo", max_length=10, choices=Type.choices)
    qty = models.IntegerField("Cantidad")  # salida: positivo (resta stock en lógica)

    qty_before = models.IntegerField("Stock Antes", default=0, editable=False)
    qty_after = models.IntegerField("Stock Después", default=0, editable=False)

    unit_cost = models.PositiveIntegerField("Costo unitario (COP)", default=0)
    note = models.CharField("Nota", max_length=200, blank=True)

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Usuario responsable")
    created_at = models.DateTimeField("Fecha", auto_now_add=True)

    class Meta:
        verbose_name = "Movimiento de inventario"
        verbose_name_plural = "Movimientos de inventario"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.qty})"