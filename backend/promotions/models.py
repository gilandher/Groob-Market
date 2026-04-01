from django.db import models
from django.contrib.auth.models import User


class Coupon(models.Model):
    """
    Cupón generado por la ruleta.
    Reglas:
    - Solo 1 cupón activo por usuario para primera compra
    - Expira en (24h)
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="coupons")
    code = models.CharField("Código", max_length=20, unique=True)

    percent = models.PositiveSmallIntegerField("Descuento (%)")
    is_used = models.BooleanField("Usado", default=False)

    # Primera compra solamente
    first_purchase_only = models.BooleanField("Solo primera compra", default=True)

    expires_at = models.DateTimeField("Expira el")

    created_at = models.DateTimeField("Creado", auto_now_add=True)

    class Meta:
        verbose_name = "Cupón"
        verbose_name_plural = "Cupones"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} - {self.percent}% - {self.user.username}"


class SpinLog(models.Model):
    """
    Registro del giro de ruleta por usuario:
    - Solo 1 giro (MVP)
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="spin_log")
    spun_at = models.DateTimeField("Giró el", auto_now_add=True)
    percent_awarded = models.PositiveSmallIntegerField("Descuento asignado (%)", default=0)

    class Meta:
        verbose_name = "Ruleta - Giro"
        verbose_name_plural = "Ruleta - Giros"

    def __str__(self):
        return f"{self.user.username} -> {self.percent_awarded}%"