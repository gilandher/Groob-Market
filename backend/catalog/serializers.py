from rest_framework import serializers
from .models import Category, Product
from .pricing import get_pricing_engine, PriceContext


class CategorySerializer(serializers.ModelSerializer):
    """Serializa categorías visibles/activas para el frontend."""
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "is_visible"]


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializa productos con precios dinámicos estilo TEMU.
    Incluye precio final, descuento y etiquetas de estrategia.
    """
    category   = CategorySerializer(read_only=True)
    image_url  = serializers.SerializerMethodField()
    pricing    = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "description",
            "category",
            "sale_price",
            "stock_qty",
            "is_active",
            "image_url",
            "pricing",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_pricing(self, obj):
        """Calcula precio dinámico usando el motor de precios."""
        request = self.context.get("request")

        # Determinar contexto del cliente
        customer_id = None
        order_count = 0
        session_key = None
        is_returning = False

        if request:
            session_key = request.session.session_key or request.META.get("REMOTE_ADDR", "")
            if request.user.is_authenticated:
                customer_id = request.user.id
                order_count = getattr(request.user, "_order_count_cache", 0)

            # Cookie de retorno (simple)
            is_returning = request.COOKIES.get("groob_visited") == "1"

        ctx = PriceContext(
            product_id=obj.id,
            sale_price=obj.sale_price,
            wholesale_cost=obj.wholesale_cost,
            min_margin_percent=obj.min_margin_percent,
            is_discountable=obj.is_discountable,
            customer_id=customer_id,
            customer_order_count=order_count,
            session_key=session_key,
            is_returning_visitor=is_returning,
        )

        engine = get_pricing_engine()
        result = engine.calculate(ctx)
        return result.to_dict()