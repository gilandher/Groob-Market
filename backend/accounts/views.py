"""
Accounts Views — Registro, OTP, Login social, Perfil, Cambio de Contraseña
"""
import logging
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP, UserProfile
from .serializers import (
    RegisterSerializer, MeSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer,
)

# Social Auth (imports de allauth no necesarios — usamos implementación propia)

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
        © 2026 Groob Market · Medellín, Colombia
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

        otp = EmailOTP.generate(email)
        sent = send_otp_email(email, otp.code)

        if not sent:
            if settings.DEBUG:
                return Response({
                    "detail": "OTP generado (modo DEBUG — email no enviado).",
                    "debug_code": otp.code,
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
        email    = (request.data.get("email") or "").strip().lower()
        code     = (request.data.get("code") or "").strip()
        name     = (request.data.get("name") or "").strip()
        password = (request.data.get("password") or "").strip()

        if not email or not code:
            return Response(
                {"detail": "Email y código son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        otp.is_verified = True
        otp.save()

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email},
        )
        if created:
            parts = name.split(" ", 1) if name else []
            user.first_name = parts[0] if parts else ""
            user.last_name  = parts[1] if len(parts) > 1 else ""
            if password:
                user.set_password(password)
            user.is_active = True
            user.save()
            # Ensure profile exists
            UserProfile.objects.get_or_create(user=user)

        profile = getattr(user, "profile", None)

        return Response({
            "detail": "¡Email verificado con éxito!",
            "user": {
                "id":         user.id,
                "email":      user.email,
                "name":       f"{user.first_name} {user.last_name}".strip() or user.username,
                "phone":      profile.phone if profile else "",
                "address":    profile.address if profile else "",
                "address2":   profile.address2 if profile else "",
                "city":       profile.city if profile else "",
                "department": profile.department if profile else "",
            },
            **get_tokens_for_user(user),
        }, status=status.HTTP_200_OK)


class MeAPIView(generics.RetrieveAPIView):
    """GET /api/v1/auth/me/ — Requiere JWT"""
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileAPIView(APIView):
    """
    PATCH /api/v1/auth/profile/ — Actualiza datos del perfil del usuario logueado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        # Update User fields
        if "name" in data and data["name"]:
            parts = data["name"].split(" ", 1)
            user.first_name = parts[0]
            user.last_name  = parts[1] if len(parts) > 1 else ""
            user.save(update_fields=["first_name", "last_name"])

        # Update or create UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        for field in ["phone", "address", "address2", "city", "department"]:
            if field in data:
                setattr(profile, field, data[field])
        profile.save()

        return Response({
            "detail": "Perfil actualizado correctamente.",
            "user": MeSerializer(user).data,
        })


class ChangePasswordAPIView(APIView):
    """
    POST /api/v1/auth/change-password/ — Cambia la contraseña del usuario.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        if not user.check_password(data["current_password"]):
            return Response(
                {"detail": "La contraseña actual es incorrecta."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(data["new_password"])
        user.save()

        return Response({"detail": "Contraseña actualizada correctamente."})


class GoogleLogin(APIView):
    """
    POST /api/v1/auth/google/
    Body: { "code": "..." }
    Intercambia el código de Google por tokens JWT de Groob Market.
    """
    permission_classes = [permissions.AllowAny]

    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

    def post(self, request):
        import requests as http_requests
        from django.conf import settings as django_settings

        code = request.data.get("code")
        if not code:
            return Response(
                {"detail": "El código de autorización es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener credenciales de Google desde settings
        google_cfg = django_settings.SOCIALACCOUNT_PROVIDERS.get("google", {}).get("APP", {})
        client_id     = google_cfg.get("client_id", "")
        client_secret = google_cfg.get("secret", "")
        redirect_uri  = "http://localhost:3000/auth/callback"

        # 1. Intercambiar código por access_token con Google
        try:
            token_resp = http_requests.post(self.GOOGLE_TOKEN_URL, data={
                "code":          code,
                "client_id":     client_id,
                "client_secret": client_secret,
                "redirect_uri":  redirect_uri,
                "grant_type":    "authorization_code",
            }, timeout=10)
            token_data = token_resp.json()
        except Exception as e:
            logger.error(f"Error al contactar a Google OAuth: {e}")
            return Response(
                {"detail": "Error al conectar con Google. Intenta de nuevo."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        access_token = token_data.get("access_token")
        if not access_token:
            logger.error(f"Google no devolvió access_token: {token_data}")
            return Response(
                {"detail": "Error al autenticar con Google. Código inválido o expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Obtener información del usuario de Google
        try:
            userinfo_resp = http_requests.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            userinfo = userinfo_resp.json()
        except Exception as e:
            logger.error(f"Error al obtener userinfo de Google: {e}")
            return Response(
                {"detail": "No se pudo obtener la información del usuario de Google."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        email = (userinfo.get("email") or "").strip().lower()
        name    = userinfo.get("name", "")
        picture = userinfo.get("picture", "")

        if not email:
            return Response(
                {"detail": "Google no devolvió un correo electrónico válido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Crear o recuperar el usuario
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email},
        )
        if created:
            parts = name.split(" ", 1) if name else []
            user.first_name = parts[0] if parts else ""
            user.last_name  = parts[1] if len(parts) > 1 else ""
            user.is_active  = True
            user.save()
            UserProfile.objects.get_or_create(user=user)
        elif name and not user.first_name:
            parts = name.split(" ", 1)
            user.first_name = parts[0]
            user.last_name  = parts[1] if len(parts) > 1 else ""
            user.save(update_fields=["first_name", "last_name"])

        profile = getattr(user, "profile", None)

        logger.info(f"✅ Google Login: {email} ({'nuevo' if created else 'existente'})")

        # 4. Retornar tokens JWT propios
        return Response({
            "detail": "¡Inicio de sesión con Google exitoso!",
            "user": {
                "id":         user.id,
                "email":      user.email,
                "name":       f"{user.first_name} {user.last_name}".strip() or user.username,
                "picture":    picture,
                "avatar_icon": profile.avatar_icon if profile else "",
                "phone":      profile.phone if profile else "",
                "address":    profile.address if profile else "",
                "address2":   profile.address2 if profile else "",
                "city":       profile.city if profile else "",
                "department": profile.department if profile else "",
            },
            **get_tokens_for_user(user),
        }, status=status.HTTP_200_OK)


class UpdateAvatarAPIView(APIView):
    """
    POST /api/v1/auth/avatar/
    Body: { "avatar_icon": "panda" | "fox" | ... }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        avatar = (request.data.get("avatar_icon") or "").strip()
        # Si llega vacío o "default", reseteamos al original
        if avatar.lower() == "default":
            avatar = ""

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.avatar_icon = avatar
        profile.save()

        picture = ""
        try:
            from allauth.socialaccount.models import SocialAccount
            social = SocialAccount.objects.get(user=request.user, provider='google')
            picture = social.extra_data.get('picture', '')
        except: pass

        return Response({
            "detail": "Perfil actualizado.",
            "avatar_icon": avatar,
            "picture": picture
        })