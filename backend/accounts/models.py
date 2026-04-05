"""
Accounts Models — OTP Verification + UserProfile
"""
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import random
import string
from datetime import timedelta
from django.utils import timezone


class EmailOTP(models.Model):
    email = models.EmailField("Correo", db_index=True)
    code = models.CharField("Código OTP", max_length=6)
    is_verified = models.BooleanField("Verificado", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "OTP de Email"
        verbose_name_plural = "OTPs de Email"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} → {self.code} ({'✓' if self.is_verified else '⏳'})"

    @classmethod
    def generate(cls, email: str) -> "EmailOTP":
        cls.objects.filter(email=email, is_verified=False).delete()
        code = "".join(random.choices(string.digits, k=6))
        return cls.objects.create(
            email=email,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

    def is_valid(self) -> bool:
        return not self.is_verified and timezone.now() < self.expires_at


class UserProfile(models.Model):
    """
    Perfil extendido del usuario: datos de contacto y direcciones de entrega.
    Se crea automáticamente cuando se crea un User (via signal post_save).
    """
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone      = models.CharField("Teléfono / WhatsApp", max_length=20, blank=True)
    address    = models.CharField("Dirección principal", max_length=255, blank=True)
    address2   = models.CharField("Segunda dirección", max_length=255, blank=True)
    city       = models.CharField("Ciudad", max_length=64, blank=True)
    department = models.CharField("Departamento", max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil de usuario"
        verbose_name_plural = "Perfiles de usuario"

    def __str__(self):
        return f"Perfil de {self.user.email or self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crea automáticamente el perfil cuando se crea un User."""
    if created:
        UserProfile.objects.get_or_create(user=instance)
