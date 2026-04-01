"""
GROOB MARKET — Resenas: Admin
================================
Panel para moderar resenas. El operador puede publicar u ocultar
resenas masivamente con las acciones, sin tener que entrar una por una.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Review


@admin.register(Review)
class AdminResena(admin.ModelAdmin):
    """
    Admin de resenas de productos.
    - Publicar / ocultar en masa con las acciones
    - Filtrar por verificadas vs no verificadas
    - Ver calificacion con estrellas visuales
    """
    list_display = (
        "producto", "usuario", "estrellas",
        "compra_verificada", "publicada", "fecha",
    )
    list_filter   = ("rating", "is_verified_purchase", "is_visible", "created_at")
    search_fields = ("product__name", "user__username", "comment")
    ordering      = ("-created_at",)
    actions       = ["publicar_resenas", "ocultar_resenas"]

    @admin.display(description="Producto")
    def producto(self, obj):
        return obj.product.name

    @admin.display(description="Usuario")
    def usuario(self, obj):
        return obj.user.username

    @admin.display(description="Calificacion")
    def estrellas(self, obj):
        llenas = "★" * obj.rating
        vacias = "☆" * (5 - obj.rating)
        return format_html(
            '<span style="color:#F59E0B;">{}</span>{}',
            llenas, vacias,
        )

    @admin.display(description="Compra verificada", boolean=True)
    def compra_verificada(self, obj):
        return obj.is_verified_purchase

    @admin.display(description="Publicada", boolean=True)
    def publicada(self, obj):
        return obj.is_visible

    @admin.display(description="Fecha")
    def fecha(self, obj):
        return obj.created_at.strftime("%d/%m/%Y")

    @admin.action(description="Publicar resenas seleccionadas")
    def publicar_resenas(self, request, queryset):
        n = queryset.update(is_visible=True)
        self.message_user(request, f"{n} resena(s) publicadas correctamente.")

    @admin.action(description="Ocultar resenas seleccionadas")
    def ocultar_resenas(self, request, queryset):
        n = queryset.update(is_visible=False)
        self.message_user(request, f"{n} resena(s) ocultadas correctamente.")