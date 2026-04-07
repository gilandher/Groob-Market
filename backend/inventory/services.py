from django.db import transaction
from catalog.models import Product
from .models import InventoryMovement


class InventoryService:
    @staticmethod
    def reserve_stock(product_id: int, qty: int, reference_note: str, user=None) -> Product:
        """
        Bloquea el producto a nivel de base de datos (SELECT FOR UPDATE)
        para impedir que compras concurrentes generen sobreventa.
        Descuenta el stock y deja una huella auditable (InventoryMovement).
        
        Para evitar Deadlocks: Este método asume que si se bloquean varios
        productos en una orden, SIEMPRE se bloquean en orden ascendente de ID.
        """
        if qty <= 0:
            raise ValueError("La cantidad a reservar debe ser mayor a cero.")

        # Bloqueo estricto de fila en PostgreSQL hasta que culmine el transaction.atomic() externo
        product = Product.objects.select_for_update().get(id=product_id)

        if product.stock_qty < qty:
            raise ValueError(f"No hay stock suficiente para '{product.name}'. Disponible: {product.stock_qty}.")

        qty_before = product.stock_qty

        # Ejecutamos el descuento de BD
        product.stock_qty -= qty
        product.save(update_fields=["stock_qty"])

        # Dejar la bitácora auditable de movimiento (Preparación para ERP)
        InventoryMovement.objects.create(
            product=product,
            movement_type=InventoryMovement.Type.OUT,
            qty=qty,
            qty_before=qty_before,
            qty_after=product.stock_qty,
            unit_cost=product.wholesale_cost,
            note=reference_note,
            user=user if user and user.is_authenticated else None,
        )

        return product
