"""
GROOB MARKET — Resenas: Modelos
=================================
Una resena se publica automaticamente solo si el usuario tiene
una orden ENTREGADA (DELIVERED) con ese producto.
Si no es compra verificada queda oculta para que el operador la modere.
"""
from django.conf import settings
from django.db import models
from catalog.models import Product
from orders.models import Order  # noqa: F401  (usado por serializers)


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Usuario",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Producto",
    )
    rating  = models.PositiveSmallIntegerField("Calificacion (1-5)")
    comment = models.TextField("Comentario", blank=True)

    is_verified_purchase = models.BooleanField("Compra verificada", default=False)
    is_visible = models.BooleanField(
        "Publicada",
        default=True,
        help_text="Desmarcar para ocultar esta resena de la tienda",
    )
    created_at = models.DateTimeField("Fecha", auto_now_add=True)

    class Meta:
        verbose_name        = "Resena"
        verbose_name_plural = "Resenas"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} — {self.rating}⭐ por {self.user.username}"