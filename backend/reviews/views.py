from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Review
from .serializers import ReviewListSerializer, ReviewCreateSerializer


class ProductReviewListAPIView(generics.ListAPIView):
    """
    Lista reseñas visibles por producto.
    GET /api/v1/products/<product_id>/reviews/
    """
    serializer_class = ReviewListSerializer

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return Review.objects.filter(
            product_id=product_id,
            is_visible=True
        ).select_related("user").order_by("-created_at")




class ReviewCreateAPIView(generics.CreateAPIView):
    """
    POST /api/v1/reviews/
    Requiere JWT.
    Si no es compra verificada: queda oculta.
    """
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Respuesta personalizada (sin exponer user/email)
        return Response(
            {
                "id": review.id,
                "product": review.product_id,
                "rating": review.rating,
                "comment": review.comment,
                "is_verified_purchase": review.is_verified_purchase,
                "is_visible": review.is_visible,
                "published": getattr(review, "published", review.is_visible),
                "message": getattr(review, "message", ""),
                "created_at": review.created_at,
            },
            status=status.HTTP_201_CREATED,
        )