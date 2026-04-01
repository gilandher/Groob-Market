"""
Accounts Models — OTP Verification
"""
from django.db import models
from django.contrib.auth.models import User
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
