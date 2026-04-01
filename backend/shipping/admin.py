"""
GROOB MARKET — Envios: Admin
==============================
El operador puede ver y editar las tarifas de envio por municipio
sin necesidad de tocar el codigo.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import TarifaEnvio


@admin.register(TarifaEnvio)
class AdminTarifaEnvio(admin.ModelAdmin):
    """
    Admin de tarifas de envio.
    Desde aqui se pueden ajustar los costos de domicilio
    para cada municipio sin necesidad de un desarrollador.
    """
    list_display  = ("municipio", "tipo_envio", "costo_cop", "dias_habil", "esta_activo")
    list_filter   = ("tipo", "esta_activo")
    search_fields = ("municipio",)
    ordering      = ("tipo", "municipio")
    list_editable = ("esta_activo",)

    @admin.display(description="Tipo")
    def tipo_envio(self, obj):
        if obj.tipo == "LOCAL":
            return format_html('<b style="color:#16A34A;">Mismo dia</b>')
        return format_html('<b style="color:#3B82F6;">Nacional</b>')

    @admin.display(description="Costo envio")
    def costo_cop(self, obj):
        return f"$ {obj.costo:,}".replace(",", ".")