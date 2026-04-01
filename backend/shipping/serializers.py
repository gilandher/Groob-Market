"""
GROOB MARKET — Envios: Serializers
"""
from rest_framework import serializers
from .models import TarifaEnvio


class TarifaEnvioSerializer(serializers.ModelSerializer):
    """Serializa una tarifa de envio para devolver al frontend."""
    tipo_label = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model  = TarifaEnvio
        fields = ["municipio", "tipo", "tipo_label", "costo", "dias_habil"]