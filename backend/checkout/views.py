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
from orders.serializers import OrderCreateSerializer, OrderDetailSerializer
from promotions.models import Coupon
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

        # Paso 1: calcular totales margin-safe
        preview = calculate_cart_totals(
            user=request.user,
            items=datos["items"],
            coupon_code=coupon_code,
        )

        # Paso 2: validar first_purchase_only
        # Bug 4 CORREGIDO: antes nunca se verificaba si el usuario ya habia comprado
        if preview["coupon"] and preview["coupon"].get("first_purchase_only"):
            ya_compro = Order.objects.filter(
                user=request.user,
                status=Order.Status.DELIVERED,
            ).exists()
            if ya_compro:
                return Response(
                    {
                        "error": (
                            "Este cupon es solo para la primera compra. "
                            "Ya tienes un pedido entregado anteriormente."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Paso 3: crear la orden
        # Bug 2 CORREGIDO: payment_method viene del request, no hardcodeado a WOMPI
        order_payload = {
            "full_name":      datos["full_name"],
            "phone":          datos["phone"],
            "city":           datos.get("city", "Bello"),
            "address":        datos["address"],
            "notes":          datos.get("notes", ""),
            "payment_method": datos.get("payment_method", "COD"),
            "items":          datos["items"],
        }

        order_serializer = OrderCreateSerializer(data=order_payload)
        order_serializer.is_valid(raise_exception=True)
        orden = order_serializer.save()

        # Bug 3 CORREGIDO: guardamos subtotal + discount + shipping + total
        # Antes solo se guardaban discount_total y total (subtotal quedaba en 0)
        orden.subtotal       = preview["subtotal"]
        orden.discount_total = preview["discount_total"]
        orden.shipping_cost  = preview.get("shipping_cost", 0)
        orden.total          = preview["total"]
        orden.save(update_fields=["subtotal", "discount_total", "shipping_cost", "total"])

        # Paso 4: marcar cupon como usado
        if preview["coupon"] and preview["discount_total"] > 0:
            Coupon.objects.filter(
                code=preview["coupon"]["code"],
                user=request.user,
                is_used=False,
            ).update(is_used=True)

        respuesta = OrderDetailSerializer(orden).data
        respuesta["checkout"] = preview

        return Response(respuesta, status=status.HTTP_201_CREATED)