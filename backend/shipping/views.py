"""
GROOB MARKET — Envios: Vistas
================================
Endpoint publico para cotizar el costo de envio segun el municipio.

GET /api/v1/envios/cotizar/?municipio=Medellin
  → Devuelve costo y tiempo de entrega

Si el municipio no esta en la tabla devuelve un mensaje claro
para que el frontend pueda mostrar "contactar por WhatsApp".
"""
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TarifaEnvio
from .serializers import TarifaEnvioSerializer


class CotizarEnvioAPIView(APIView):
    """
    GET /api/v1/envios/cotizar/?municipio=Bello
    Publico — no requiere JWT.

    Respuesta exitosa:
    {
        "municipio": "Bello",
        "tipo": "LOCAL",
        "tipo_label": "Mismo dia (local)",
        "costo": 5000,
        "dias_habil": 0
    }

    Si no se encuentra:
    {
        "disponible": false,
        "mensaje": "...",
        "whatsapp_url": "..."
    }
    """
    permission_classes = []  # Publico

    def get(self, request):
        municipio_raw = request.query_params.get("municipio", "").strip()

        if not municipio_raw:
            return Response(
                {"error": "Debes enviar el parametro ?municipio=NombreCiudad"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Busqueda case-insensitive para mayor tolerancia
        tarifa = TarifaEnvio.objects.filter(
            municipio__iexact=municipio_raw,
            esta_activo=True,
        ).first()

        if tarifa:
            return Response(TarifaEnvioSerializer(tarifa).data, status=status.HTTP_200_OK)

        # Municipio no encontrado → guiar al usuario por WhatsApp
        wa_number = getattr(settings, "WHATSAPP_NUMBER", "573011963515")
        wa_texto  = (
            f"Hola Groob Market! Quiero saber si hacen envios a "
            f"{municipio_raw} y cual es el costo."
        ).replace(" ", "%20")

        return Response(
            {
                "disponible": False,
                "municipio":  municipio_raw,
                "mensaje": (
                    f"Por ahora no tenemos tarifa fija para {municipio_raw}. "
                    "Contactanos por WhatsApp para coordinar el envio."
                ),
                "whatsapp_url": f"https://wa.me/{wa_number}?text={wa_texto}",
            },
            status=status.HTTP_200_OK,
        )