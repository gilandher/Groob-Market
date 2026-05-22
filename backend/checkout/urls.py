"""
GROOB MARKET — Checkout: URLs
"""
from django.urls import path
from .views import CheckoutPreviewAPIView, CheckoutConfirmAPIView, WompiWebhookAPIView

urlpatterns = [
    # Vista previa de totales (sin crear orden todavia)
    path("checkout/preview/", CheckoutPreviewAPIView.as_view(), name="checkout-preview"),

    # Confirmacion final: crea la orden
    path("checkout/confirmar/", CheckoutConfirmAPIView.as_view(), name="checkout-confirmar"),

    # Webhook de Wompi para confirmación asíncrona de pagos
    path("payments/wompi-webhook/", WompiWebhookAPIView.as_view(), name="wompi-webhook"),
]