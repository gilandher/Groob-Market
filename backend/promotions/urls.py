from django.urls import path
from .views import SpinAPIView

urlpatterns = [
    path("promotions/spin/", SpinAPIView.as_view(), name="promotions-spin"),
]