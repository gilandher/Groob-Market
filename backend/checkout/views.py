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


class WompiWebhookAPIView(APIView):
    """
    POST /api/v1/checkout/payments/wompi-webhook/
    Webhook para recibir actualizaciones de transacciones de Wompi de forma asíncrona.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.data
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Webhook de Wompi recibido: {payload}")
        
        # 1. Validar la firma
        from django.conf import settings
        
        signature_data = payload.get("signature", {})
        properties = signature_data.get("properties", [])
        checksum = signature_data.get("checksum", "")
        timestamp = payload.get("timestamp")
        data = payload.get("data", {})
        
        if not properties or not checksum or timestamp is None:
            logger.error("Webhook de Wompi incompleto (falta firma o timestamp)")
            return Response({"error": "Payload incompleto"}, status=status.HTTP_400_BAD_REQUEST)
            
        concatenated = ""
        for prop in properties:
            parts = prop.split(".")
            curr = data
            for part in parts:
                if isinstance(curr, dict) and part in curr:
                    curr = curr[part]
                else:
                    curr = None
                    break
            if curr is None:
                logger.error(f"Propiedad de firma no encontrada en el payload: {prop}")
                return Response({"error": f"Propiedad {prop} no encontrada"}, status=status.HTTP_400_BAD_REQUEST)
            concatenated += str(curr)
            
        concatenated += str(timestamp)
        concatenated += settings.WOMPI_EVENTS_SECRET
        
        import hashlib
        calculated_checksum = hashlib.sha256(concatenated.encode("utf-8")).hexdigest()
        
        if calculated_checksum != checksum:
            logger.error(f"Firma invalida de Webhook de Wompi. Calculada: {calculated_checksum}, Recibida: {checksum}")
            return Response({"error": "Firma inválida"}, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. Procesar el evento
        event_type = payload.get("event")
        if event_type == "transaction.updated":
            transaction_data = data.get("transaction", {})
            reference = transaction_data.get("reference", "")
            tx_status = transaction_data.get("status", "")
            wompi_id = transaction_data.get("id", "")
            
            logger.info(f"Procesando transaccion Wompi {wompi_id} con referencia {reference} y estado {tx_status}")
            
            # Obtener el ID del pedido desde la referencia "GM-{order_id}-{timestamp}"
            parts = reference.split("-")
            if len(parts) >= 2 and parts[0] == "GM":
                try:
                    order_id = int(parts[1])
                except ValueError:
                    logger.error(f"Referencia de Wompi con ID de orden no valido: {reference}")
                    return Response({"error": "Referencia no válida"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                logger.error(f"Referencia de Wompi no tiene el formato esperado (GM-ID-TS): {reference}")
                return Response({"error": "Formato de referencia no válido"}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                logger.error(f"Orden #{order_id} no encontrada para la referencia de Wompi {reference}")
                return Response({"error": "Orden no encontrada"}, status=status.HTTP_404_NOT_FOUND)
                
            # Actualizar datos de pago
            order.wompi_transaction_id = wompi_id
            
            if tx_status == "APPROVED":
                order.payment_status = Order.PaymentStatus.PAID
                # Si la orden estaba en estado NEW, la pasamos a CONFIRMED
                if order.status == Order.Status.NEW:
                    order.status = Order.Status.CONFIRMED
            elif tx_status in ["DECLINED", "VOIDED", "ERROR"]:
                order.payment_status = Order.PaymentStatus.FAILED
            elif tx_status == "PENDING":
                order.payment_status = Order.PaymentStatus.PENDING
                
            order.save()
            logger.info(f"Orden #{order.id} actualizada por webhook de Wompi. Payment Status: {order.payment_status}, Order Status: {order.status}")
            
        return Response({"status": "ok"}, status=status.HTTP_200_OK)