from django.db import transaction
from checkout.services import calculate_cart_totals
from .models import Order, OrderItem
from catalog.models import Product
from promotions.models import Coupon
from inventory.models import InventoryMovement
from inventory.services import InventoryService


@transaction.atomic
def create_customer_order(user, order_data: dict, items_data: list, coupon_code: str = None) -> Order:
    """
    Servicio unificado para la creación de órdenes.
    1. Calcula totales financieros reales usando la lógica de checkout.
    2. Crea la orden.
    3. Descuenta inventario.
    4. Usa cupones.
    """
    # 1. Calcular totales reales centralizados (con envío y descuento)
    preview = calculate_cart_totals(
        user=user,
        items=items_data,
        coupon_code=coupon_code,
        city=order_data.get("city")
    )

    # 2. Validar cupón de primera compra
    if preview.get("coupon") and preview["coupon"].get("first_purchase_only"):
        if user and user.is_authenticated:
            ya_compro = Order.objects.filter(
                user=user,
                status=Order.Status.DELIVERED
            ).exists()
            if ya_compro:
                raise ValueError("Este cupón es solo para la primera compra. Ya tienes un pedido entregado.")

    # 3. Crear orden
    order = Order(**order_data)
    if user and user.is_authenticated:
        order.user = user

    # inyectar los calculos financieros seguros desde el backend
    order.subtotal = preview["subtotal"]
    order.discount_total = preview["discount_total"]
    order.shipping_cost = preview["shipping_cost"]
    order.total = preview["total"]
    
    # Asignar código de cupón y el porcentaje base si hay
    if preview.get("coupon"):
        order.coupon_code = preview["coupon"]["code"]
        order.coupon_discount = preview["coupon"]["percent"]
    
    order.save()

    # 4. Procesar items y descuento de stock con BLOQUEO SEGURO
    # Para prevenir Web Deadlocks, ordenamos los items por ID. Así si un usuario compra (A,B) 
    # y otro compra (B,A) al mismo tiempo, Postgres los bloqueará siempre en orden (A, B).
    items_sorted = sorted(items_data, key=lambda x: x["product_id"])

    for item in items_sorted:
        product_id = item["product_id"]
        qty = int(item["qty"])

        # Descuento atómico usando el abstract builder del ERP. select_for_update interno.
        ref_note = f"Venta — Pedido #{order.order_number}"
        product = InventoryService.reserve_stock(product_id, qty, ref_note, user)

        # Recuperar los detalles calculados para esta linea específica
        # preview['lines'] tiene el ID.
        line_info = next((dl for dl in preview["lines"] if dl["product_id"] == product.id), None)
        line_subtotal = line_info["line_subtotal"] if line_info else (product.sale_price * qty)

        OrderItem.objects.create(
            order=order,
            product=product,
            qty=qty,
            unit_price=product.sale_price,
            line_subtotal=line_subtotal,
            product_name=product.name,
            product_sku=product.sku
        )

    # 5. Marcar cupón como usado (si aplicó al menos un peso de descuento)
    if preview.get("coupon") and preview["discount_total"] > 0:
        if user and user.is_authenticated:
            Coupon.objects.filter(
                code=preview["coupon"]["code"],
                user=user,
                is_used=False
            ).update(is_used=True)

    return order
