from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from catalog.models import Product
from orders.services import create_customer_order
import threading

User = get_user_model()

class ConcurrentOrderTests(TransactionTestCase):
    """
    IMPORTANTE: Debe heredar de TransactionTestCase porque 
    TestCase envuelve cada test en una transaccion y bloquea
    el comportamiento real de hilos separados probando bloqueos de fila.
    """

    def setUp(self):
        self.user1 = User.objects.create_user(email="buyer1@test.com", password="pwd")
        self.user2 = User.objects.create_user(email="buyer2@test.com", password="pwd")
        
        # Producto con stock = 1
        self.product = Product.objects.create(
            name="PlayStation 5",
            sku="PS5",
            sale_price=2500000,
            wholesale_cost=2000000,
            stock_qty=1,
            is_active=True,
        )

    def test_prevent_overselling(self):
        """
        Si dos usuarios intentan comprar el último PlayStation 5 al MISMO TIEMPO,
        usando hilos paralelos reales, el select_for_update() de Postgres
        obligará al segundo hilo a esperar que el primero acabe. Al revisar,
        el segundo hilo verá stock=0 y fallará, impidiendo saldo negativo.
        """
        results = []

        def worker(user, items_data):
            try:
                order_data = {
                    "full_name": "Test",
                    "phone": "123",
                    "city": "Bello",
                    "address": "Calle 123",
                }
                order = create_customer_order(
                    user=user,
                    order_data=order_data,
                    items_data=items_data
                )
                results.append("SUCCESS")
            except ValueError as e:
                # El error de "No hay stock suficiente"
                results.append(str(e))
            except Exception as e:
                results.append(str(e))

        items = [{"product_id": self.product.id, "qty": 1}]

        # Lanzar 2 peticiones concurrentes
        t1 = threading.Thread(target=worker, args=(self.user1, items))
        t2 = threading.Thread(target=worker, args=(self.user2, items))

        t1.start()
        t2.start()

        t1.join()
        t2.join()

        # Solo UNO debe decir SUCCESS, el otro debe tener error de stock
        success_count = results.count("SUCCESS")
        
        self.assertEqual(success_count, 1, "Solo uno de los hilos debería haber tenido éxito")
        
        # Recargar producto desde DB
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_qty, 0, "El stock no debe caer a negativo")
