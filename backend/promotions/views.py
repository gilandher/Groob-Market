from datetime import timedelta
import secrets

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Coupon, SpinLog
from .serializers import CouponSerializer
from .services import spin_discount_percent


class SpinAPIView(APIView):
    """
    POST /api/v1/promotions/spin/
    Requiere JWT.
    - Solo 1 giro por usuario (SpinLog OneToOne)
    - Crea un cupón válido 24h
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        # Si ya giró: devolver cupón activo si existe
        if hasattr(user, "spin_log"):
            coupon = Coupon.objects.filter(
                user=user,
                is_used=False,
                expires_at__gt=timezone.now(),
            ).order_by("-created_at").first()

            return Response(
                {
                    "already_spun": True,
                    "coupon": CouponSerializer(coupon).data if coupon else None,
                    "message": "Ya giraste la ruleta. Usa tu cupón disponible (si no ha expirado).",
                },
                status=status.HTTP_200_OK,
            )

        percent = spin_discount_percent()

        # Registrar giro
        SpinLog.objects.create(user=user, percent_awarded=percent)

        # Crear cupón
        code = ("GRB" + secrets.token_hex(3)).upper()  # ej: GRB8F3A1B
        expires_at = timezone.now() + timedelta(hours=24)

        coupon = Coupon.objects.create(
            user=user,
            code=code,
            percent=percent,
            is_used=False,
            first_purchase_only=True,
            expires_at=expires_at,
        )

        return Response(
            {
                "already_spun": False,
                "coupon": CouponSerializer(coupon).data,
                "message": "Cupón generado ✅",
            },
            status=status.HTTP_201_CREATED,
        )