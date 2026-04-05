"""
GROOB MARKET — Shipping Models
================================
Un solo precio de envío calculado por zona de distancia desde la bodega
en Bello, Antioquia. Sin modalidades, solo domicilio estándar.

Zonas por distancia aproximada:
  ZONA_1  Bello               0 – 5 km     $6.500   ~45 min
  ZONA_2  Medellín            5 – 20 km    $7.000   ~1 h
  ZONA_3  Valle de Aburrá    20 – 40 km    $8.500   ~1.5 h
  ZONA_4  Antioquia cercana  40 – 80 km    $11.000  ~2.5 h
  ZONA_5  Antioquia lejana   80 – 200 km   $15.000  +1 día
  ZONA_6  Nacional          +200 km        $18.000  3-5 días
"""
from django.db import models


class ZonaEnvio(models.TextChoices):
    ZONA_1 = "ZONA_1", "Zona 1 — Bello (0-5 km)"
    ZONA_2 = "ZONA_2", "Zona 2 — Medellín (5-20 km)"
    ZONA_3 = "ZONA_3", "Zona 3 — Valle de Aburrá (20-40 km)"
    ZONA_4 = "ZONA_4", "Zona 4 — Antioquia cercana (40-80 km)"
    ZONA_5 = "ZONA_5", "Zona 5 — Antioquia lejana (80-200 km)"
    ZONA_6 = "ZONA_6", "Zona 6 — Nacional (+200 km)"


# ── Tabla de zonas predeterminadas ────────────────────────────────────────────
# municipio_normalizado → (zona, precio_base, tiempo_estimado)
MUNICIPIOS_ZONA: dict[str, tuple[str, int, str]] = {
    # Zona 1 — Bello
    "bello":              (ZonaEnvio.ZONA_1, 6_500,  "30 – 60 min"),

    # Zona 2 — Medellín
    "medellin":           (ZonaEnvio.ZONA_2, 7_000,  "1 – 1.5 h"),
    "medellín":           (ZonaEnvio.ZONA_2, 7_000,  "1 – 1.5 h"),

    # Zona 3 — Valle de Aburrá
    "itagui":             (ZonaEnvio.ZONA_3, 8_500,  "1.5 – 2 h"),
    "itagüi":             (ZonaEnvio.ZONA_3, 8_500,  "1.5 – 2 h"),
    "envigado":           (ZonaEnvio.ZONA_3, 8_500,  "1.5 – 2 h"),
    "sabaneta":           (ZonaEnvio.ZONA_3, 8_500,  "1.5 – 2 h"),
    "la estrella":        (ZonaEnvio.ZONA_3, 8_500,  "2 – 2.5 h"),
    "caldas":             (ZonaEnvio.ZONA_3, 8_500,  "2 – 2.5 h"),
    "copacabana":         (ZonaEnvio.ZONA_3, 8_500,  "1 – 1.5 h"),
    "girardota":          (ZonaEnvio.ZONA_3, 8_500,  "1 – 1.5 h"),

    # Zona 4 — Antioquia cercana
    "barbosa":            (ZonaEnvio.ZONA_4, 11_000, "2 – 3 h"),
    "guarne":             (ZonaEnvio.ZONA_4, 11_000, "2 – 3 h"),
    "rionegro":           (ZonaEnvio.ZONA_4, 11_000, "2.5 – 3.5 h"),
    "el retiro":          (ZonaEnvio.ZONA_4, 11_000, "3 – 4 h"),
    "la ceja":            (ZonaEnvio.ZONA_4, 11_000, "3 – 4 h"),
    "marinilla":          (ZonaEnvio.ZONA_4, 11_000, "2.5 – 3.5 h"),
    "el santuario":       (ZonaEnvio.ZONA_4, 11_000, "3 – 4 h"),
    "santa barbara":      (ZonaEnvio.ZONA_4, 11_000, "3 – 4 h"),
    "fredonia":           (ZonaEnvio.ZONA_4, 11_000, "3 – 4 h"),

    # Zona 5 — Antioquia lejana
    "santa fe de antioquia": (ZonaEnvio.ZONA_5, 15_000, "1 día"),
    "yarumal":            (ZonaEnvio.ZONA_5, 15_000, "1 día"),
    "caucasia":           (ZonaEnvio.ZONA_5, 15_000, "1 día"),
    "turbo":              (ZonaEnvio.ZONA_5, 15_000, "1 – 2 días"),
    "apartado":           (ZonaEnvio.ZONA_5, 15_000, "1 – 2 días"),
    "jerico":             (ZonaEnvio.ZONA_5, 15_000, "1 día"),
    "andes":              (ZonaEnvio.ZONA_5, 15_000, "1 día"),
    "urrao":              (ZonaEnvio.ZONA_5, 15_000, "1 – 2 días"),
}


class TarifaEnvio(models.Model):
    """
    Tarifa de envío editable desde el Admin.
    El operador puede sobrescribir cualquier municipio/precio
    sin tocar código.
    """
    municipio   = models.CharField("Municipio / Ciudad", max_length=100, unique=True)
    zona        = models.CharField(
        "Zona de distancia",
        max_length=10,
        choices=ZonaEnvio.choices,
        default=ZonaEnvio.ZONA_6,
    )
    precio      = models.PositiveIntegerField("Precio de envío (COP)", default=18_000)
    tiempo      = models.CharField("Tiempo estimado", max_length=50, default="3 – 5 días hábiles")
    esta_activo = models.BooleanField("Activo", default=True)

    class Meta:
        verbose_name        = "Tarifa de envío"
        verbose_name_plural = "Tarifas de envío"
        ordering            = ["zona", "municipio"]

    def __str__(self):
        return f"{self.municipio} ({self.get_zona_display()}) — ${self.precio:,}".replace(",", ".")

    @property
    def precio_fmt(self) -> str:
        return f"$ {self.precio:,}".replace(",", ".")