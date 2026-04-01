"""
Accounts Views — Registro, OTP, Login social
"""
import logging
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP
from .serializers import RegisterSerializer, MeSerializer

logger = logging.getLogger(__name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def send_otp_email(email: str, code: str):
    """Envía el OTP al correo del usuario."""
    subject = f"🔐 Tu código de verificación Groob Market: {code}"
    plain = f"""
¡Hola! 👋

Tu código de verificación para Groob Market es:

    {code}

Este código es válido por 15 minutos.

Si no solicitaste este código, ignora este mensaje.

— El equipo de Groob Market 🛍️
    """
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#6c4dff;font-size:28px;font-weight:900;margin:0;">Groob Market</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px;">Vitrina Virtual</p>
      </div>
      <div style="background:white;border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 16px rgba(108,77,255,0.08);">
        <p style="font-size:16px;color:#374151;margin-bottom:24px;">Tu código de verificación es:</p>
        <div style="background:linear-gradient(135deg,#6c4dff,#9b8cff);border-radius:12px;padding:20px 40px;display:inline-block;margin-bottom:24px;">
          <span style="color:white;font-size:40px;font-weight:900;letter-spacing:0.15em;">{code}</span>
        </div>
        <p style="color:#64748b;font-size:13px;">Válido por <strong>15 minutos</strong>. No lo compartas con nadie.</p>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
        © 2025 Groob Market · Medellín, Colombia
      </p>
    </div>
    """
    try:
        send_mail(
            subject=subject,
            message=plain,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@groobmarket.com"),
            recipient_list=[email],
            html_message=html,
            fail_silently=False,
        )
        logger.info(f"✉️ OTP enviado a {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Error enviando OTP a {email}: {e}")
        return False


# ─── Views ────────────────────────────────────────────────────────────────────

class RegisterAPIView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Crea usuario y envía OTP"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class SendOTPView(APIView):
    """
    POST /api/v1/auth/send-otp/
    Body: { email: string }
    Genera y envía un OTP de 6 dígitos al correo.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "El correo es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email is already verified (user exists and is_active)
        if User.objects.filter(email=email, is_active=True).exists():
            # Check if this user has already claimed a spin coupon or made orders
            pass  # Allow login flow to continue

        otp = EmailOTP.generate(email)
        sent = send_otp_email(email, otp.code)

        if not sent:
            # En desarrollo, retornamos el código directamente (para pruebas)
            if settings.DEBUG:
                return Response({
                    "detail": "OTP generado (modo DEBUG — email no enviado).",
                    "debug_code": otp.code,  # Solo en DEBUG
                    "email": email,
                }, status=status.HTTP_200_OK)
            return Response(
                {"detail": "No se pudo enviar el correo. Verifica la configuración de email."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({
            "detail": f"Código enviado a {email}. Válido 15 minutos.",
            "email": email,
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """
    POST /api/v1/auth/verify-otp/
    Body: { email: string, code: string, name?: string, password?: string }
    Verifica el OTP. Si el usuario no existe, lo crea.
    Retorna tokens JWT.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        code = (request.data.get("code") or "").strip()
        name = (request.data.get("name") or "").strip()
        password = (request.data.get("password") or "").strip()

        if not email or not code:
            return Response(
                {"detail": "Email y código son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the most recent OTP for this email
        otp = EmailOTP.objects.filter(email=email, is_verified=False).order_by("-created_at").first()

        if not otp:
            return Response(
                {"detail": "No hay un código pendiente para este correo. Solicita uno nuevo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not otp.is_valid():
            return Response(
                {"detail": "El código ha expirado. Solicita uno nuevo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.code != code:
            return Response(
                {"detail": "Código incorrecto. Intenta de nuevo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark as verified
        otp.is_verified = True
        otp.save()

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email},
        )
        if created:
            # Set name
            parts = name.split(" ", 1) if name else []
            user.first_name = parts[0] if parts else ""
            user.last_name = parts[1] if len(parts) > 1 else ""
            if password:
                user.set_password(password)
            user.is_active = True
            user.save()

        return Response({
            "detail": "¡Email verificado con éxito!",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            },
            **get_tokens_for_user(user),
        }, status=status.HTTP_200_OK)


class MeAPIView(generics.RetrieveAPIView):
    """GET /api/v1/auth/me/ — Requiere JWT"""
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user