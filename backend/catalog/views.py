from django.shortcuts import render

# Create your views here.

from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer


class ProductListAPIView(generics.ListAPIView):
    """
    Lista de productos activos.
    (Por ahora: todo lo activo. Luego filtramos por categoría Tecnología.)
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related("category").order_by("id")


class ProductDetailAPIView(generics.RetrieveAPIView):
    """Detalle de un producto por ID."""
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_active=True).select_related("category")
