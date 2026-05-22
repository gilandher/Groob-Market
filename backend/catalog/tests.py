from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.files.storage import default_storage
from django.utils.text import slugify
import json
import base64
from .models import Category, Product

class ProductImportAdminTests(TestCase):
    def setUp(self):
        # Create categories
        self.tech_category = Category.objects.create(
            name="Tecnología",
            slug="tecnologia",
            is_active=True,
            is_visible=True
        )
        
        # Create a superuser to access Django Admin
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@groob.com",
            password="adminpassword"
        )
        
        self.client = Client()
        self.client.login(username="admin", password="adminpassword")
        self.import_url = reverse("admin:catalog_product_importar_csv")

    def test_import_view_get(self):
        """
        Test that GET requests to the admin view load successfully
        and inject categories in the context.
        """
        response = self.client.get(self.import_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "admin/catalog/product/importar_csv.html")
        self.assertIn("categories_json", response.context)
        
        categories_data = json.loads(response.context["categories_json"])
        self.assertTrue(any(c["name"] == "Tecnología" for c in categories_data))

    def test_import_view_post_success(self):
        """
        Test that POST requests with valid products import them successfully.
        """
        # A simple 1x1 red PNG base64
        base64_img = (
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        )
        
        payload = {
            "products": [
                {
                    "name": "Nuevo Cargador 20W",
                    "sku": "NEW-CARG-20W",
                    "category_name": "Tecnología",
                    "description": "Cargador rápido para iPhone",
                    "wholesale_cost": 45000,
                    "sale_price": 75000,
                    "stock_qty": 50,
                    "discount_percent": 10,
                    "min_margin_percent": 25,
                    "is_active": True,
                    "image_base64": base64_img
                },
                {
                    "name": "Vidrio Blindado",
                    "sku": "NEW-VID-BLIND",
                    "category_name": "Accesorios Nuevos",  # New category should be auto-created
                    "description": "Protector de pantalla",
                    "wholesale_cost": 10000,
                    "sale_price": 25000,
                    "stock_qty": 100,
                    "discount_percent": 0,
                    "min_margin_percent": 25,
                    "is_active": True,
                    "image_base64": ""
                }
            ]
        }
        
        response = self.client.post(
            self.import_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["created"], 2)
        self.assertEqual(data["updated"], 0)
        
        # Verify db persistence
        p1 = Product.objects.get(sku="NEW-CARG-20W")
        self.assertEqual(p1.name, "Nuevo Cargador 20W")
        self.assertEqual(p1.category, self.tech_category)
        self.assertEqual(p1.discount_percent, 10)
        self.assertTrue(p1.image.name.startswith("products/NEW-CARG-20W_"))
        
        # Cleanup image
        if p1.image:
            p1.image.delete(save=False)

        # Verify auto-created category
        p2 = Product.objects.get(sku="NEW-VID-BLIND")
        self.assertEqual(p2.category.name, "Accesorios Nuevos")
        self.assertEqual(p2.category.slug, slugify("Accesorios Nuevos"))

    def test_import_view_post_validation_error(self):
        """
        Test that validation errors (e.g. sale price lower than cost) fail the entire import
        and trigger database transaction rollback.
        """
        payload = {
            "products": [
                {
                    "name": "Vidrio Defectuoso",
                    "sku": "DEF-VID-1",
                    "category_name": "Tecnología",
                    "description": "Precio menor al costo",
                    "wholesale_cost": 15000,
                    "sale_price": 10000,  # Invalid: sale price < wholesale cost
                    "stock_qty": 40,
                    "discount_percent": 0,
                    "min_margin_percent": 25,
                    "is_active": True,
                    "image_base64": ""
                }
            ]
        }
        
        response = self.client.post(
            self.import_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("Error de validación", data["detail"])
        
        # Verify rollback
        self.assertFalse(Product.objects.filter(sku="DEF-VID-1").exists())

