from rest_framework import serializers

from .models import Review
from orders.models import Order, OrderItem


class ReviewListSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar reseñas al público (solo visibles).
    """
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "product",
            "user_name",
            "rating",
            "comment",
            "is_verified_purchase",
            "created_at",
        ]

    def get_user_name(self, obj):
        return obj.user.username


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Crear reseña:
    - Solo se publica automáticamente si es compra verificada (pedido DELIVERED)
    - Si NO es verificada: se guarda oculta (pendiente de verificación/moderación)
    """

    published = serializers.BooleanField(read_only=True)
    message = serializers.CharField(read_only=True)

    class Meta:
        model = Review
        fields = ["product", "rating", "comment", "published", "message"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("El rating debe estar entre 1 y 5.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        product = validated_data["product"]

        # Compra verificada = pedido entregado con ese producto
        has_verified = OrderItem.objects.filter(
            product=product,
            order__user=user,
            order__status=Order.Status.DELIVERED,
        ).exists()

        # Si NO es verificada, queda oculta automáticamente
        is_visible = has_verified

        review = Review.objects.create(
            user=user,
            product=product,
            rating=validated_data["rating"],
            comment=validated_data.get("comment", ""),
            is_verified_purchase=has_verified,
            is_visible=is_visible,
        )

        # En DRF, el serializer de salida se arma con el mismo serializer.
        # Guardamos flags para la respuesta.
        review.published = is_visible
        review.message = (
            "Reseña publicada ✅ (compra verificada)"
            if is_visible
            else "Reseña guardada y pendiente de verificación/moderación ⏳"
        )

        return review