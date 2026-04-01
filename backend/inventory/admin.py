from django.contrib import admin
from .models import InventoryMovement


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    """
    Admin para ver el historial de inventario.
    """
    list_display = ("created_at", "movement_type", "product", "qty", "unit_cost", "note")
    list_filter = ("movement_type", "created_at")
    search_fields = ("product__name", "note")
    ordering = ("-created_at",)