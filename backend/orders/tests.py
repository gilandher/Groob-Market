from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from catalog.models import Product, Category
from accounts.models import UserProfile
from orders.models import Order
from orders.services import create_customer_order

User = get_user_model()

class OrdersAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testbuyer@example.com", email="testbuyer@example.com", password="password123")
        self.client.force_authenticate(user=self.user)
        
        self.category = Category.objects.create(name="Accesorios", slug="accesorios")
        self.product = Product.objects.create(
            name="Cargador iPhone 20W",
            sku="CG-IPHONE-20W",
            category=self.category,
            sale_price=80000,
            wholesale_cost=40000,
            stock_qty=10,
            is_active=True
        )

        self.my_orders_url = reverse("order-my")
        self.by_cedula_url = reverse("order-by-cedula")

    def test_create_order_copies_cedula(self):
        """Verifica que al crear un pedido se copia la cédula desde el perfil del usuario."""
        profile = UserProfile.objects.get(user=self.user)
        profile.cedula = "1234567890"
        profile.save()

        self.user.refresh_from_db()


        order_data = {
            "full_name": "Andres Inciarte",
            "email": "testbuyer@example.com",
            "phone": "3001234567",
            "department": "Antioquia",
            "city": "Medellin",
            "address": "Calle 10 # 5-6",
            "payment_method": "COD"
        }
        items_data = [{"product_id": self.product.id, "qty": 1}]
        
        order = create_customer_order(user=self.user, order_data=order_data, items_data=items_data)
        
        self.assertEqual(order.cedula, "1234567890")
        self.assertEqual(order.user, self.user)

    def test_my_orders_view_filters_by_user_or_email(self):
        """Verifica que el listado de pedidos devuelva pedidos del usuario o de su correo."""
        # 1. Crear un pedido asociado al usuario
        order_user = Order.objects.create(
            user=self.user,
            full_name="Andres",
            email="another@email.com",
            phone="123",
            address="Addr 1",
            total=80000
        )
        
        # 2. Crear un pedido con el correo del usuario, pero sin usuario asociado (invitado)
        order_guest = Order.objects.create(
            user=None,
            full_name="Andres Invitado",
            email="testbuyer@example.com",
            phone="123",
            address="Addr 2",
            total=80000
        )

        # 3. Crear un pedido no relacionado
        Order.objects.create(
            user=None,
            full_name="Otro",
            email="other@email.com",
            phone="123",
            address="Addr 3",
            total=80000
        )

        res = self.client.get(self.my_orders_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.json()
        results = data
        self.assertEqual(len(results), 2)

        
        order_ids = [o["id"] for o in results]
        self.assertIn(order_user.id, order_ids)
        self.assertIn(order_guest.id, order_ids)

    def test_order_by_cedula_view(self):
        """Verifica que se puedan listar pedidos buscando por cédula."""
        # Pedido con cedula A
        order_a = Order.objects.create(
            full_name="Cliente A",
            email="a@example.com",
            phone="123",
            address="Addr A",
            cedula="998877",
            total=80000
        )

        # Pedido con cedula B
        Order.objects.create(
            full_name="Cliente B",
            email="b@example.com",
            phone="123",
            address="Addr B",
            cedula="112233",
            total=80000
        )

        # Buscar por cédula A
        res = self.client.get(f"{self.by_cedula_url}?cedula=998877")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.json()
        results = data
        self.assertEqual(len(results), 1)

        self.assertEqual(results[0]["id"], order_a.id)
        self.assertEqual(results[0]["cedula"], "998877")
