"""
GROOB MARKET — Checkout: Vistas
=================================
Endpoints del proceso de pago:

  POST /api/v1/checkout/preview/    → Totales antes de confirmar (sin crear orden)
  POST /api/v1/checkout/confirmar/  → Crea la orden y aplica el cupón

Ambos requieren JWT. El cálculo de descuentos es margin-safe:
nunca se permite vender por debajo del margen mínimo configurado por producto.
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.serializers import OrderDetailSerializer
from promotions.models import Coupon
from orders.services import create_customer_order
from .serializers import CheckoutPreviewSerializer, CheckoutConfirmSerializer
from .services import calculate_cart_totals


class CheckoutPreviewAPIView(APIView):
    """
    POST /api/v1/checkout/preview/
    Requiere JWT.
    Devuelve el desglose de totales con descuento margin-safe
    sin crear ninguna orden todavia.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = calculate_cart_totals(
            user=request.user,
            items=serializer.validated_data["items"],
            coupon_code=serializer.validated_data.get("coupon_code") or None,
        )

        return Response(resultado, status=status.HTTP_200_OK)


class CheckoutConfirmAPIView(APIView):
    """
    POST /api/v1/checkout/confirmar/
    Requiere JWT.

    Flujo:
      1. Calcula totales margin-safe
      2. Valida cupón first_purchase_only si aplica
      3. Crea la orden con todos los totales correctos
      4. Marca cupón como usado si aplico descuento
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        datos = serializer.validated_data
        coupon_code = datos.get("coupon_code") or None

        # 1. Preparar payload de orden
        order_payload = {
            "full_name":      datos["full_name"],
            "phone":          datos["phone"],
            "city":           datos.get("city", "Bello"),
            "address":        datos["address"],
            "notes":          datos.get("notes", ""),
            "payment_method": datos.get("payment_method", "COD"),
        }

        # 2. Llamada al servicio ÚNICO centralizado
        orden = create_customer_order(
            user=request.user,
            order_data=order_payload,
            items_data=datos["items"],
            coupon_code=coupon_code
        )

        respuesta = OrderDetailSerializer(orden).data
        # Adjuntamos el preview financiero de checkout que se calculó en el backend
        from .services import calculate_cart_totals
        respuesta["checkout"] = calculate_cart_totals(
            user=request.user,
            items=datos["items"],
            coupon_code=coupon_code,
            city=order_payload["city"]
        )

        return Response(respuesta, status=status.HTTP_201_CREATED)