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

        user_exists = User.objects.filter(email=email).exists()
        if not user_exists:
            data_policy_accepted = request.data.get("data_policy_accepted")
            if not data_policy_accepted:
                return Response(
                    {"detail": "Debe aceptar los términos y la política de tratamiento de datos personales."},
                    status=status.HTTP_400_BAD_REQUEST
                )

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
            # Ensure profile exists and save policy acceptance
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.data_policy_accepted = True
            profile.save()

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
                "cedula":     profile.cedula if profile else "",
                "avatar":     profile.avatar if profile else "avatar_1",
                "data_policy_accepted": profile.data_policy_accepted if profile else False,
                "is_staff":   user.is_staff,
                "is_superuser": user.is_superuser,
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
        profile, _ = UserProfile.objects.get_or_create(user=user)

        from rest_framework import serializers as drf_serializers
        from datetime import timedelta
        from django.utils import timezone

        # 1. Validar / actualizar Cédula (locked if already has a value)
        if "cedula" in data:
            new_cedula = data["cedula"].strip()
            if profile.cedula and profile.cedula != new_cedula:
                raise drf_serializers.ValidationError(
                    {"cedula": ["La cédula no se puede modificar una vez establecida por motivos de seguridad y garantía."]}
                )
            if new_cedula:
                profile.cedula = new_cedula

        # 2. Validar / actualizar Email (7 days limit)
        if "email" in data:
            new_email = data["email"].strip().lower()
            if new_email and new_email != user.email:
                # Verificar si el email ya existe en otro usuario
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                    raise drf_serializers.ValidationError(
                        {"email": ["Este correo electrónico ya está registrado por otro usuario."]}
                    )
                # Verificar límite de 7 días
                if profile.email_last_changed:
                    time_elapsed = timezone.now() - profile.email_last_changed
                    if time_elapsed < timedelta(days=7):
                        time_left = timedelta(days=7) - time_elapsed
                        days = time_left.days
                        hours = int(time_left.seconds // 3600)
                        minutes = int((time_left.seconds // 60) % 60)
                        time_str = ""
                        if days > 0:
                            time_str += f"{days} día(s) "
                        if hours > 0 or days > 0:
                            time_str += f"{hours} hora(s) "
                        time_str += f"{minutes} minuto(s)"
                        raise drf_serializers.ValidationError(
                            {"email": [f"El correo solo se puede cambiar una vez por semana. Espera {time_str}."]}
                        )
                # Actualizar email y username
                user.email = new_email
                user.username = new_email
                user.save(update_fields=["email", "username"])
                profile.email_last_changed = timezone.now()

        # Update User fields (first_name, last_name)
        if "first_name" in data:
            user.first_name = data["first_name"].strip()
        if "last_name" in data:
            user.last_name = data["last_name"].strip()
        user.save(update_fields=["first_name", "last_name"])

        # Update or create UserProfile
        for field in ["phone", "address", "address2", "city", "department", "avatar", "data_policy_accepted"]:
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


def verify_google_id_token(id_token: str):
    """
    Valida un id_token de Google usando el endpoint de tokeninfo de Google.
    Retorna (email, name, picture_url) si es válido, de lo contrario None.
    """
    import urllib.request
    import urllib.parse
    import json
    import ssl

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token)}"
    try:
        # Usar contexto SSL por defecto
        context = ssl.create_default_context()
        req = urllib.request.Request(url, headers={"User-Agent": "GroobMarket-Backend"})
        with urllib.request.urlopen(req, context=context, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            
            if "email" not in data:
                return None
            
            iss = data.get("iss", "")
            if iss not in ["accounts.google.com", "https://accounts.google.com"]:
                return None
            
            email = data.get("email")
            name = data.get("name") or f"{data.get('given_name', '')} {data.get('family_name', '')}".strip()
            picture = data.get("picture")
            return email, name, picture
    except Exception as e:
        logger.error(f"Error al verificar id_token de Google: {e}")
        return None


class SocialLoginAPIView(APIView):
    """
    POST /api/v1/auth/social-login/
    Body (Real): { id_token: string, provider: "Google" }
    Body (Simulador): { email: string, name: string, provider: string }
    Autenticación rápida/real para Google/Facebook/Instagram.
    Si el usuario no existe, lo crea automáticamente.
    Retorna tokens JWT.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import uuid
        import random
        
        id_token = request.data.get("id_token")
        provider = (request.data.get("provider") or "").strip()
        picture_url = None

        if id_token and provider.lower() == "google":
            # Flujo Real de Google OAuth
            google_data = verify_google_id_token(id_token)
            if not google_data:
                return Response(
                    {"detail": "El token de Google es inválido, ha expirado o no pudo ser verificado."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            email, name, picture_url = google_data
        else:
            # Flujo Simulador (o fallback)
            email    = (request.data.get("email") or "").strip().lower()
            name     = (request.data.get("name") or "").strip()

        if not email:
            return Response(
                {"detail": "El correo electrónico es requerido para el inicio de sesión social."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar usuario por email
        user = User.objects.filter(email=email).first()
        created = False

        if not user:
            # Crear nuevo usuario
            user = User(email=email, username=email)
            parts = name.split(" ", 1) if name else []
            user.first_name = parts[0] if parts else ""
            user.last_name  = parts[1] if len(parts) > 1 else ""
            # Generar una contraseña aleatoria segura
            user.set_password(str(uuid.uuid4()))
            user.is_active = True
            user.save()
            created = True

        # Asegurar que el perfil existe
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Forzar aceptación de la política de datos para cuentas creadas vía social auth
        if not profile.data_policy_accepted:
            profile.data_policy_accepted = True
            profile.save()

        # Determinar avatar predeterminado o guardar foto de Google
        if picture_url:
            # Si tiene foto de perfil de Google, la guardamos
            profile.avatar = picture_url
            profile.save()
        elif created:
            # Asignar un avatar aleatorio local
            profile.avatar = "avatar_" + str(random.randint(1, 9))
            profile.save()

        return Response({
            "detail": "Inicio de sesión social exitoso",
            "user": {
                "id":         user.id,
                "email":      user.email,
                "name":       f"{user.first_name} {user.last_name}".strip() or user.username,
                "phone":      profile.phone,
                "address":    profile.address,
                "address2":   profile.address2,
                "city":       profile.city,
                "department": profile.department,
                "cedula":     profile.cedula,
                "avatar":     profile.avatar,
                "data_policy_accepted": profile.data_policy_accepted,
                "is_staff":   user.is_staff,
                "is_superuser": user.is_superuser,
            },
            **get_tokens_for_user(user),
        }, status=status.HTTP_200_OK)