"""
GROOB MARKET — Envios: Modelos
================================
Tabla de tarifas de domicilio local por municipio.
Origen de despacho: Quitasol, Bello.

Municipios con entrega el mismo dia:
  Bello, Medellin, Itagui, Envigado, Sabaneta

Envios nacionales: transportadora externa (costo manual por ahora).
"""
from django.db import models


class TarifaEnvio(models.Model):
    """
    Tarifa de domicilio por municipio.
    El operador puede ajustar los precios desde el admin sin tocar codigo.
    """

    class TipoEnvio(models.TextChoices):
        LOCAL    = "LOCAL",    "Mismo dia (local)"
        NACIONAL = "NACIONAL", "Nacional (transportadora)"

    municipio  = models.CharField("Municipio", max_length=80, unique=True)
    tipo       = models.CharField("Tipo de envio", max_length=20, choices=TipoEnvio.choices)
    costo      = models.PositiveIntegerField("Costo envio (COP)")
    dias_habil = models.PositiveSmallIntegerField(
        "Dias habiles de entrega",
        default=0,
        help_text="0 = mismo dia, 3 = tres dias habiles, etc."
    )
    esta_activo = models.BooleanField("Activo", default=True)

    class Meta:
        verbose_name        = "Tarifa de envio"
        verbose_name_plural = "Tarifas de envio"
        ordering            = ["tipo", "municipio"]

    def __str__(self):
        return f"{self.municipio} — ${self.costo:,} ({self.get_tipo_display()})".replace(",", ".")