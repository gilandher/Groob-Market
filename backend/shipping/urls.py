"""
GROOB MARKET — Envios: URLs
"""
from django.urls import path
from .views import CotizarEnvioAPIView

urlpatterns = [
    # Cotizar envio por municipio
    path("envios/cotizar/", CotizarEnvioAPIView.as_view(), name="envios-cotizar"),
]