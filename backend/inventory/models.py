from django.db import models
from catalog.models import Product


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
    unit_cost = models.PositiveIntegerField("Costo unitario (COP)", default=0)
    note = models.CharField("Nota", max_length=200, blank=True)

    created_at = models.DateTimeField("Fecha", auto_now_add=True)

    class Meta:
        verbose_name = "Movimiento de inventario"
        verbose_name_plural = "Movimientos de inventario"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.qty})"