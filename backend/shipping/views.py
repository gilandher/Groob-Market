"""
GROOB MARKET — Shipping Views
================================
Calcula el costo de envío según el municipio del cliente.
Primero busca en la tabla TarifaEnvio (configurable desde admin),
si no existe, usa la tabla estática MUNICIPIOS_ZONA del modelo.

GET  /api/v1/envios/cotizar/?municipio=Bello
POST /api/v1/envios/cotizar/  Body: { "municipio": "Bello" }

Respuesta:
  {
    "disponible": true,
    "municipio": "Bello",
    "zona": "ZONA_1",
    "zona_label": "Zona 1 — Bello (0-5 km)",
    "precio": 6500,
    "precio_fmt": "$ 6.500",
    "tiempo": "30 – 60 min",
    "nota": "..."
  }
"""
import unicodedata
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TarifaEnvio, MUNICIPIOS_ZONA, ZonaEnvio


def normalizar(text: str) -> str:
    """Minúsculas, sin tildes, sin espacios extra."""
    text = text.strip().lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def buscar_zona(municipio_raw: str):
    """
    Devuelve (zona, precio, tiempo) o None si no se encuentra.
    Orden de búsqueda:
      1. Tabla TarifaEnvio en BD (configurable desde admin)
      2. Tabla estática MUNICIPIOS_ZONA en models.py
      3. Fallback Nacional si el municipio contiene "colombia" o similar
    """
    norm = normalizar(municipio_raw)

    # 1. Buscar en BD (coincidencia exacta normalizada)
    try:
        qs = TarifaEnvio.objects.filter(esta_activo=True)
        for tarifa in qs:
            if normalizar(tarifa.municipio) == norm:
                return tarifa.zona, tarifa.precio, tarifa.tiempo
            # Coincidencia parcial
            if norm in normalizar(tarifa.municipio) or normalizar(tarifa.municipio) in norm:
                return tarifa.zona, tarifa.precio, tarifa.tiempo
    except Exception:
        pass

    # 2. Tabla estática del modelo
    if norm in MUNICIPIOS_ZONA:
        zona, precio, tiempo = MUNICIPIOS_ZONA[norm]
        return zona, precio, tiempo

    # Búsqueda parcial en tabla estática
    for key, (zona, precio, tiempo) in MUNICIPIOS_ZONA.items():
        if key in norm or norm in key:
            return zona, precio, tiempo

    return None


class CotizarEnvioAPIView(APIView):
    """
    Público — no requiere JWT.
    Retorna el precio de envío calculado por distancia (zona).
    """
    permission_classes = []

    def _resolver(self, municipio_raw: str) -> Response:
        if not municipio_raw:
            return Response(
                {"error": "Debes enviar el parámetro 'municipio'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = buscar_zona(municipio_raw)
        wa_number = getattr(settings, "WHATSAPP_NUMBER", "573011963515")

        if resultado is None:
            # Municipio fuera de cobertura automática → redirige a WhatsApp
            wa_text = (
                f"Hola Groob Market! Quiero saber si hacen envíos a "
                f"{municipio_raw} y cuál es el costo. 📦"
            ).replace(" ", "%20")
            return Response({
                "disponible":   False,
                "municipio":    municipio_raw,
                "zona":         None,
                "zona_label":   None,
                "precio":       None,
                "precio_fmt":   None,
                "tiempo":       None,
                "mensaje":      (
                    f"Aún no tenemos tarifa automática para {municipio_raw}. "
                    "Escríbenos y te cotizamos el envío al instante. 🚀"
                ),
                "whatsapp_url": f"https://wa.me/{wa_number}?text={wa_text}",
            })

        zona, precio, tiempo = resultado

        # Etiqueta legible de la zona
        zona_labels = dict(ZonaEnvio.choices)
        zona_label  = zona_labels.get(zona, zona)

        # Formato COP
        precio_fmt = f"$ {precio:,}".replace(",", ".")

        return Response({
            "disponible":  True,
            "municipio":   municipio_raw,
            "zona":        zona,
            "zona_label":  zona_label,
            "precio":      precio,
            "precio_fmt":  precio_fmt,
            "tiempo":      tiempo,
            "nota":        "Precio para zona urbana. Zonas rurales pueden tener recargo.",
            "origen":      "Bello, Antioquia",
        })

    def get(self, request):
        municipio = request.query_params.get("municipio", "").strip()
        return self._resolver(municipio)

    def post(self, request):
        municipio = (request.data.get("municipio") or "").strip()
        return self._resolver(municipio)