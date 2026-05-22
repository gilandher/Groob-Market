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
            "full_name", "email", "phone", "cedula",
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
            "cedula":         {"required": False, "allow_blank": True},
        }

    def validate(self, data):
        if not data.get("items"):
            raise serializers.ValidationError("La orden debe tener al menos 1 producto.")
        return data

    def create(self, validated_data):
        from .services import create_customer_order

        items_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", None)
        validated_data.pop("coupon_discount", None)

        # En Django REST Framework, si llamas `serializer.save(user=request.user)`, 
        # `user` se inyecta mágicamente dentro de validated_data
        user = validated_data.pop("user", None)
        
        # En caso de que no venga por kwargs pero esté en el context de la request
        if not user and self.context.get("request"):
            req_user = self.context["request"].user
            if req_user.is_authenticated:
                user = req_user

        return create_customer_order(
            user=user,
            order_data=validated_data,
            items_data=items_data,
            coupon_code=coupon_code
        )


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
    wompi_payment_data = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            "id", "order_number", "status", "status_display", "status_emoji",
            "payment_method", "payment_status", "wompi_transaction_id", "wompi_payment_data",
            "full_name", "email", "phone", "cedula",
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

    def get_wompi_payment_data(self, obj):
        if obj.payment_method == "WOMPI" and obj.payment_status != "PAID":
            import time
            import hashlib
            from django.conf import settings
            
            amount_in_cents = int(obj.total) * 100
            currency = "COP"
            # Generar una referencia única para Wompi usando timestamp
            reference = f"GM-{obj.id}-{int(time.time())}"
            
            # Concatenar para la firma: reference + amount_in_cents + currency + integrity_secret
            raw_str = f"{reference}{amount_in_cents}{currency}{settings.WOMPI_INTEGRITY_SECRET}"
            signature = hashlib.sha256(raw_str.encode('utf-8')).hexdigest()
            
            return {
                "public_key": settings.WOMPI_PUBLIC_KEY,
                "reference": reference,
                "amount_in_cents": amount_in_cents,
                "currency": currency,
                "signature": signature
            }
        return None