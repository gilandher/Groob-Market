"""
GROOB MARKET — Shipping Serializers
"""
from rest_framework import serializers
from .models import TarifaEnvio


class TarifaEnvioSerializer(serializers.ModelSerializer):
    zona_label = serializers.CharField(source="get_zona_display", read_only=True)
    precio_fmt = serializers.CharField(read_only=True)

    class Meta:
        model  = TarifaEnvio
        fields = ["municipio", "zona", "zona_label", "precio", "precio_fmt", "tiempo"]