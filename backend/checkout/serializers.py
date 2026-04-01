"""
GROOB MARKET — Checkout: Serializers
======================================
Validan los datos que llegan al checkout antes de procesarlos.
"""
from rest_framework import serializers


class CheckoutPreviewSerializer(serializers.Serializer):
    """
    Datos para calcular el preview del carrito.
    No crea ninguna orden, solo calcula totales.
    """
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        help_text='Lista de productos: [{"product_id": 1, "qty": 2}]'
    )


class CheckoutConfirmSerializer(serializers.Serializer):
    """
    Datos para confirmar y crear la orden.
    Incluye datos del cliente + items + metodo de pago opcional.
    """
    # Datos del cliente
    full_name = serializers.CharField(max_length=120)
    phone     = serializers.CharField(max_length=30)
    city      = serializers.CharField(max_length=60, required=False, allow_blank=True)
    address   = serializers.CharField(max_length=180)
    notes     = serializers.CharField(max_length=250, required=False, allow_blank=True)

    # Metodo de pago: COD (contraentrega) por defecto, WHATSAPP para pedidos sin registro
    # BUG 2 CORREGIDO: este campo ahora llega desde el request, no hardcodeado
    payment_method = serializers.ChoiceField(
        choices=["COD", "WHATSAPP", "PAYU", "WOMPI"],
        default="COD",
        required=False,
    )

    # Cupon opcional de la ruleta
    coupon_code = serializers.CharField(required=False, allow_blank=True)

    # Productos del carrito
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        help_text='Lista de productos: [{"product_id": 1, "qty": 2}]'
    )