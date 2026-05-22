from django.urls import path
from .views import (
    ProductListAPIView, ProductDetailAPIView,
    CategoryListAPIView, ProductImportTemplateAPIView, ProductBulkImportAPIView
)

urlpatterns = [
    path("products/", ProductListAPIView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailAPIView.as_view(), name="product-detail"),
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("products/import-template/", ProductImportTemplateAPIView.as_view(), name="product-import-template"),
    path("products/bulk-import/", ProductBulkImportAPIView.as_view(), name="product-bulk-import"),
]