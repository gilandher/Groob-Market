from django.urls import path
from .views import (
    OrderCreateView, MyOrdersView, OrderDetailView,
    OrderStatusUpdateView, OrderByEmailView,
)

urlpatterns = [
    path("orders/",             OrderCreateView.as_view(),      name="order-create"),
    path("orders/my/",          MyOrdersView.as_view(),         name="order-my"),
    path("orders/by-email/",    OrderByEmailView.as_view(),     name="order-by-email"),
    path("orders/<int:pk>/",    OrderDetailView.as_view(),      name="order-detail"),
    path("orders/<int:pk>/status/", OrderStatusUpdateView.as_view(), name="order-status"),
]