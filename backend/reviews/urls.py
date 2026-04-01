from django.urls import path
from .views import ProductReviewListAPIView, ReviewCreateAPIView

urlpatterns = [
    path("products/<int:product_id>/reviews/", ProductReviewListAPIView.as_view(), name="product-review-list"),
    path("reviews/", ReviewCreateAPIView.as_view(), name="review-create"),
]