from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterAPIView, MeAPIView, SendOTPView, VerifyOTPView

urlpatterns = [
    # Auth
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", MeAPIView.as_view(), name="auth-me"),
    # OTP
    path("auth/send-otp/", SendOTPView.as_view(), name="auth-send-otp"),
    path("auth/verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
]