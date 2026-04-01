from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer


class OrderCreateView(generics.CreateAPIView):
    """
    POST /api/v1/orders/
    Crea el pedido, descuenta stock y dispara el email de confirmación.
    """
    serializer_class   = OrderCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=request.user if request.user.is_authenticated else None)
        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class MyOrdersView(generics.ListAPIView):
    """
    GET /api/v1/orders/my/
    Lista todos los pedidos del usuario autenticado.
    """
    serializer_class   = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items__product")


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/orders/{id}/
    Detalle de un pedido (solo el dueño o admin).
    """
    serializer_class   = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().prefetch_related("items__product")
        return Order.objects.filter(user=self.request.user).prefetch_related("items__product")


class OrderStatusUpdateView(APIView):
    """
    PATCH /api/v1/orders/{id}/status/
    Solo staff/admin puede cambiar el estado.
    """
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Pedido no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        tracking   = request.data.get("tracking_number", "")

        if new_status not in Order.Status.values:
            return Response(
                {"detail": f"Estado inválido. Opciones: {list(Order.Status.values)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        if tracking:
            order.tracking_number = tracking
        order.save()  # Dispara la señal → email automático

        return Response(OrderDetailSerializer(order).data)


class OrderByEmailView(generics.ListAPIView):
    """
    GET /api/v1/orders/by-email/?email=xxx
    Permite a clientes no registrados ver sus pedidos por email.
    """
    serializer_class   = OrderDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        email = self.request.query_params.get("email", "").strip().lower()
        if not email:
            return Order.objects.none()
        return Order.objects.filter(email__iexact=email).prefetch_related("items__product")