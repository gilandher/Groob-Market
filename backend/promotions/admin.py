"""
GROOB MARKET — Promociones: Admin
====================================
Panel en espanol para gestionar cupones y giros de ruleta.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Coupon, SpinLog


@admin.register(Coupon)
class AdminCupon(admin.ModelAdmin):
    """
    Admin de cupones generados por la ruleta.
    El operador ve que cupones estan activos, cuales fueron usados y cuando expiran.
    """
    list_display = (
        "codigo", "usuario", "descuento_pct", "estado_cupon",
        "solo_primera_compra", "expira_el", "fecha_creacion",
    )
    list_filter   = ("is_used", "first_purchase_only", "expires_at")
    search_fields = ("code", "user__username")
    ordering      = ("-created_at",)
    readonly_fields = ("code", "user", "percent", "created_at")

    @admin.display(description="Codigo")
    def codigo(self, obj):
        return obj.code

    @admin.display(description="Usuario")
    def usuario(self, obj):
        return obj.user.username

    @admin.display(description="Descuento")
    def descuento_pct(self, obj):
        return f"{obj.percent}%"

    @admin.display(description="Estado")
    def estado_cupon(self, obj):
        if obj.is_used:
            return format_html('<b style="color:#DC2626;">Usado</b>')
        return format_html('<b style="color:#16A34A;">Disponible</b>')

    @admin.display(description="Solo 1a compra", boolean=True)
    def solo_primera_compra(self, obj):
        return obj.first_purchase_only

    @admin.display(description="Expira el")
    def expira_el(self, obj):
        return obj.expires_at.strftime("%d/%m/%Y %H:%M")

    @admin.display(description="Creado el")
    def fecha_creacion(self, obj):
        return obj.created_at.strftime("%d/%m/%Y %H:%M")


@admin.register(SpinLog)
class AdminGiroRuleta(admin.ModelAdmin):
    """
    Registro de giros de la ruleta.
    Cada usuario solo puede girar 1 vez (OneToOne).
    """
    list_display    = ("usuario", "descuento_ganado", "fecha_giro")
    search_fields   = ("user__username",)
    ordering        = ("-spun_at",)
    readonly_fields = ("user", "percent_awarded", "spun_at")

    @admin.display(description="Usuario")
    def usuario(self, obj):
        return obj.user.username

    @admin.display(description="Descuento ganado")
    def descuento_ganado(self, obj):
        if obj.percent_awarded == 0:
            return "Sin descuento"
        return f"{obj.percent_awarded}%"

    @admin.display(description="Fecha del giro")
    def fecha_giro(self, obj):
        return obj.spun_at.strftime("%d/%m/%Y %H:%M")