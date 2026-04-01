from rest_framework import serializers
from catalog.models import Product
from .models import Order, OrderItem
from inventory.models import InventoryMovement


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty        = serializers.IntegerField(min_value=1)
    name       = serializers.CharField(required=False, allow_blank=True)
    sku        = serializers.CharField(required=False, allow_blank=True)
    sale_price = serializers.IntegerField(required=False, default=0)


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            # Contacto
            "full_name", "email", "phone",
            # Dirección
            "department", "city", "address", "address2", "notes",
            # GPS opcional
            "location_lat", "location_lng",
            # Pago y cupón
            "payment_method", "coupon_code", "coupon_discount",
            # Items
            "items",
        ]
        extra_kwargs = {
            "email":          {"required": True},
            "department":     {"required": True},
            "city":           {"required": True},
            "address":        {"required": True},
            "address2":       {"required": False},
            "notes":          {"required": False},
            "location_lat":   {"required": False},
            "location_lng":   {"required": False},
            "coupon_code":    {"required": False},
            "coupon_discount":{"required": False, "default": 0},
        }

    def validate(self, data):
        if not data.get("items"):
            raise serializers.ValidationError("La orden debe tener al menos 1 producto.")
        return data

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon_discount = validated_data.get("coupon_discount", 0)

        order = Order.objects.create(
            **validated_data,
            subtotal=0, shipping_cost=0, discount_total=0, total=0,
        )

        subtotal = 0

        for item_data in items_data:
            try:
                product = Product.objects.get(id=item_data["product_id"])
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Producto #{item_data['product_id']} no encontrado.")

            if not product.is_active:
                raise serializers.ValidationError(f"Producto '{product.name}' no disponible.")

            if product.stock_qty < item_data["qty"]:
                raise serializers.ValidationError(
                    f"Stock insuficiente para {product.name}. Disponible: {product.stock_qty}"
                )

            qty          = item_data["qty"]
            unit_price   = product.sale_price
            line_subtotal = unit_price * qty

            OrderItem.objects.create(
                order=order,
                product=product,
                qty=qty,
                unit_price=unit_price,
                unit_cost=product.wholesale_cost,
                line_subtotal=line_subtotal,
                product_name=product.name,
                product_sku=product.sku,
            )

            # Descontar stock
            product.stock_qty -= qty
            product.save(update_fields=["stock_qty"])

            # Historial de inventario
            InventoryMovement.objects.create(
                product=product,
                movement_type=InventoryMovement.Type.OUT,
                qty=qty,
                unit_cost=product.wholesale_cost,
                note=f"Venta — Pedido #{order.order_number}",
            )

            subtotal += line_subtotal

        # ── Calcular totales ──────────────────────────────────────────────────
        discount_amount = round(subtotal * coupon_discount / 100) if coupon_discount else 0

        # Determinar costo de envío según ciudad
        if order.is_same_day_delivery():
            shipping = 0
            order.logistics_company = Order.LogisticsCompany.OWN
        else:
            # Nacional: costo base — se coordinará con la empresa logística
            shipping = 0  # Se confirma por WhatsApp
            order.logistics_company = Order.LogisticsCompany.COORDINADORA

        order.subtotal       = subtotal
        order.discount_total = discount_amount
        order.shipping_cost  = shipping
        order.total          = subtotal - discount_amount + shipping
        order.save(update_fields=[
            "subtotal", "discount_total", "shipping_cost", "total", "logistics_company"
        ])

        return order


# ─── Detail serializers ───────────────────────────────────────────────────────

class OrderItemDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_sku  = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ["id", "product_id", "product_name", "product_sku",
                  "qty", "unit_price", "line_subtotal"]

    def get_product_name(self, obj):
        return obj.product_name or obj.product.name

    def get_product_sku(self, obj):
        return obj.product_sku or obj.product.sku


class OrderDetailSerializer(serializers.ModelSerializer):
    items          = OrderItemDetailSerializer(many=True, read_only=True)
    order_number   = serializers.ReadOnlyField()
    status_display = serializers.SerializerMethodField()
    status_emoji   = serializers.SerializerMethodField()
    same_day       = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            "id", "order_number", "status", "status_display", "status_emoji",
            "payment_method", "payment_status",
            "full_name", "email", "phone",
            "department", "city", "address", "address2", "notes",
            "location_lat", "location_lng",
            "logistics_company", "tracking_number",
            "coupon_code", "coupon_discount",
            "subtotal", "discount_total", "shipping_cost", "total",
            "same_day", "created_at", "updated_at",
            "items",
        ]

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_status_emoji(self, obj):
        return obj.get_status_emoji()

    def get_same_day(self, obj):
        return obj.is_same_day_delivery()