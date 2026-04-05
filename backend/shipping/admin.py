"""
GROOB MARKET — Shipping Admin
================================
Panel para gestionar tarifas de envío por municipio.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import TarifaEnvio, ZonaEnvio


@admin.register(TarifaEnvio)
class AdminTarifaEnvio(admin.ModelAdmin):
    """
    Permite al operador ver y editar las tarifas de envío
    sin necesidad de un desarrollador.
    """
    list_display  = ("municipio", "zona_badge", "precio_display", "tiempo", "esta_activo")
    list_filter   = ("zona", "esta_activo")
    search_fields = ("municipio",)
    ordering      = ("zona", "municipio")
    list_editable = ("esta_activo",)

    fieldsets = (
        ("📍 Municipio", {
            "fields": ("municipio", "zona"),
        }),
        ("💰 Tarifa", {
            "fields": ("precio", "tiempo"),
        }),
        ("⚙️ Estado", {
            "fields": ("esta_activo",),
        }),
    )

    # ── Colores por zona ──────────────────────────────────────────────────────
    ZONA_COLORS = {
        ZonaEnvio.ZONA_1: ("#16a34a", "Zona 1 • Bello"),
        ZonaEnvio.ZONA_2: ("#2563eb", "Zona 2 • Medellín"),
        ZonaEnvio.ZONA_3: ("#7c3aed", "Zona 3 • Valle de Aburrá"),
        ZonaEnvio.ZONA_4: ("#d97706", "Zona 4 • Ant. Cercana"),
        ZonaEnvio.ZONA_5: ("#dc2626", "Zona 5 • Ant. Lejana"),
        ZonaEnvio.ZONA_6: ("#64748b", "Zona 6 • Nacional"),
    }

    @admin.display(description="Zona", ordering="zona")
    def zona_badge(self, obj):
        color, label = self.ZONA_COLORS.get(obj.zona, ("#64748b", obj.zona))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:20px;'
            'font-size:11px;font-weight:700;">{}</span>',
            color, label,
        )

    @admin.display(description="Precio envío", ordering="precio")
    def precio_display(self, obj):
        # Formateamos primero el número, luego lo incrustamos con format_html
        precio_str = f"{obj.precio:,}".replace(",", ".")
        return format_html('<b style="color:#6c4dff;">$ {}</b>', precio_str)