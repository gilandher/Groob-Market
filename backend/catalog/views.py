from django.shortcuts import render
from django.utils.text import slugify
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
import csv
import base64
from django.core.files.base import ContentFile
from django.http import HttpResponse

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer


class ProductListAPIView(generics.ListAPIView):
    """
    Lista de productos activos.
    (Por ahora: todo lo activo. Luego filtramos por categoría Tecnología.)
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related("category").order_by("id")
        category_slug = self.request.query_params.get("cat", None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset


class ProductDetailAPIView(generics.RetrieveAPIView):
    """Detalle de un producto por ID."""
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_active=True).select_related("category")


class CategoryListAPIView(generics.ListAPIView):
    """Lista de todas las categorías activas/visibles."""
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True).order_by("name")
    permission_classes = [permissions.AllowAny]


class ProductImportTemplateAPIView(APIView):
    """Descarga de la plantilla CSV oficial para importación."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="plantilla_productos_groob.csv"'
        
        writer = csv.writer(response, delimiter=';')
        # Cabeceras
        writer.writerow([
            "Categoría",
            "Nombre",
            "SKU",
            "Descripción",
            "Costo Mayorista",
            "Precio Venta",
            "Stock",
            "Descuento",
            "Margen Mínimo",
            "Activo"
        ])
        # Datos de ejemplo
        writer.writerow([
            "Tecnología",
            "Cargador iPhone 20W",
            "CARG-IPH-20W",
            "Cargador rápido de 20W para iPhone con entrada USB-C.",
            "45000",
            "75000",
            "50",
            "10",
            "25",
            "Sí"
        ])
        writer.writerow([
            "Accesorios",
            "Cable Tipo C Trenzado",
            "CBL-C-TRENZ",
            "Cable de carga y datos con recubrimiento de nylon trenzado.",
            "8000",
            "19900",
            "120",
            "0",
            "20",
            "Sí"
        ])
        return response


class ProductBulkImportAPIView(APIView):
    """
    POST /api/v1/products/bulk-import/
    Recibe un array de productos en JSON y los crea/actualiza en lote de forma atómica.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        products_data = request.data.get("products", [])
        if not products_data:
            return Response(
                {"detail": "No se encontraron productos para importar."},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        updated_count = 0

        try:
            with transaction.atomic():
                for item in products_data:
                    name = item.get("name", "").strip()
                    sku = item.get("sku", "").strip()
                    category_name = item.get("category_name", "").strip()
                    description = item.get("description", "").strip()
                    
                    try:
                        wholesale_cost = int(item.get("wholesale_cost", 0))
                        sale_price = int(item.get("sale_price", 0))
                        stock_qty = int(item.get("stock_qty", 0))
                        discount_percent = int(item.get("discount_percent", 0))
                        min_margin_percent = int(item.get("min_margin_percent", 25))
                    except (ValueError, TypeError):
                        raise DjangoValidationError("Los precios, stock y porcentajes deben ser números válidos.")

                    is_active = item.get("is_active", True)
                    image_base64 = item.get("image_base64", None)

                    if not name or not sku or not category_name:
                        raise DjangoValidationError("El nombre, SKU y Categoría son campos obligatorios.")

                    # Buscar o crear categoría
                    category = Category.objects.filter(name__iexact=category_name).first()
                    if not category:
                        category = Category.objects.create(
                            name=category_name,
                            slug=slugify(category_name),
                            is_active=True,
                            is_visible=True
                        )

                    # Buscar o crear producto por SKU
                    product = Product.objects.filter(sku=sku).first()
                    if product:
                        updated_count += 1
                    else:
                        product = Product(sku=sku)
                        created_count += 1

                    product.name = name
                    product.category = category
                    product.description = description
                    product.wholesale_cost = wholesale_cost
                    product.sale_price = sale_price
                    product.stock_qty = stock_qty
                    product.is_active = is_active
                    product.discount_percent = discount_percent
                    product.min_margin_percent = min_margin_percent

                    # Procesar imagen en base64
                    if image_base64:
                        try:
                            if ";base64," in image_base64:
                                format_part, img_str = image_base64.split(';base64,')
                                ext = format_part.split('/')[-1]
                                # Para formatos raros, dejar png por defecto
                                if ext not in ['jpeg', 'jpg', 'png', 'webp', 'svg+xml']:
                                    ext = 'png'
                                if ext == 'svg+xml':
                                    ext = 'svg'
                            else:
                                img_str = image_base64
                                ext = 'png'

                            img_data = base64.b64decode(img_str)
                            filename = f"{sku}_{int(timezone.now().timestamp())}.{ext}"
                            product.image.save(filename, ContentFile(img_data), save=False)
                        except Exception as decode_err:
                            raise DjangoValidationError(f"Error decodificando imagen de {name}: {str(decode_err)}")

                    # Ejecutar validaciones del modelo
                    product.full_clean()
                    product.save()

            return Response({
                "detail": f"Importación exitosa. Creados: {created_count}, Actualizados: {updated_count}.",
                "created": created_count,
                "updated": updated_count
            }, status=status.HTTP_200_OK)

        except DjangoValidationError as val_err:
            return Response(
                {"detail": val_err.message_dict if hasattr(val_err, 'message_dict') else str(val_err)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Error al realizar la importación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
