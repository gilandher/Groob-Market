"""
Management command: seed_products
==================================
Crea categorías y productos de demostración para el nicho tecnología/celulares.
Las imágenes vienen de URLs públicas (Unsplash/Pexels CDN).

Uso:
    python manage.py seed_products
    python manage.py seed_products --clear   # borra todo primero
"""

import urllib.request
import os
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from catalog.models import Category, Product

# ---------------------------------------------------------------------------
# Datos de seed - Productos reales del nicho
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"name": "Tecnología",            "slug": "tecnologia"},
    {"name": "Celulares y accesorios","slug": "celulares"},
    {"name": "Hogar",                 "slug": "hogar"},
    {"name": "Moda",                  "slug": "moda"},
    {"name": "Belleza",               "slug": "belleza"},
]

# Imágenes de productos tech de alta calidad (Unsplash public CDN)
PRODUCTS = [
    # ─── TECNOLOGÍA ───────────────────────────────────────────────────────
    {
        "category": "tecnologia",
        "name": "Cargador iPhone 20W USB-C Original",
        "sku": "CARG-IP-20W",
        "description": "Cargador rápido compatible con iPhone 12, 13, 14, 15 Pro Max. Carga hasta un 50% en 30 minutos. Cable USB-C incluido.",
        "wholesale_cost": 12000,
        "sale_price": 35000,
        "stock_qty": 45,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "Audífonos Bluetooth TWS Pro Max",
        "sku": "AUD-BT-TWS01",
        "description": "Verdaderos audífonos inalámbricos con cancelación activa de ruido, 30 horas de batería, resistencia al agua IPX5. Sonido HiFi y bajos potentes.",
        "wholesale_cost": 25000,
        "sale_price": 79000,
        "stock_qty": 30,
        "min_margin_percent": 30,
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "Cable de Carga Tipo C (2m Trenzado)",
        "sku": "CAB-TC-2M",
        "description": "Cable USB-C a USB-C trenzado de nylon, carga rápida 65W, transferencia de datos 10Gbps. Compatible con Samsung, Huawei, Xiaomi, MacBook.",
        "wholesale_cost": 5000,
        "sale_price": 20000,
        "stock_qty": 120,
        "min_margin_percent": 20,
        "image_url": "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "SmartWatch Fitness Pro Serie 8",
        "sku": "SWT-FIT-S8",
        "description": "Reloj inteligente con monitor de frecuencia cardíaca, SpO2, GPS, 150+ modos deportivos. Pantalla AMOLED 1.9\" y batería de 7 días. Compatible iOS y Android.",
        "wholesale_cost": 45000,
        "sale_price": 149000,
        "stock_qty": 18,
        "min_margin_percent": 30,
        "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "Teclado Mecánico Gaming RGB",
        "sku": "TEC-MECA-RGB",
        "description": "Teclado mecánico TKL con switches Blue, retroiluminación RGB programable por tecla, anti-ghosting 100% y palm rest magnético incluido.",
        "wholesale_cost": 55000,
        "sale_price": 159000,
        "stock_qty": 12,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "Mouse Inalámbrico Silencioso Ergonómico",
        "sku": "MOU-INAL-ERG",
        "description": "Mouse vertical ergonómico 2.4GHz + Bluetooth, 4000 DPI ajustable, clic silencioso, batería recargable USB-C de larga duración. Reduce la fatiga en la muñeca.",
        "wholesale_cost": 18000,
        "sale_price": 55000,
        "stock_qty": 25,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "Hub USB-C 7 en 1 (HDMI 4K + SD + USB)",
        "sku": "HUB-UC-7IN1",
        "description": "Estación de acoplamiento USB-C con salida HDMI 4K@60Hz, 3× USB 3.0, lector SD/MicroSD, USB-C PD 100W, Ethernet Gigabit. Diseño aluminio ultradelgado.",
        "wholesale_cost": 28000,
        "sale_price": 85000,
        "stock_qty": 20,
        "min_margin_percent": 28,
        "image_url": "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&q=80",
    },
    {
        "category": "tecnologia",
        "name": "Soporte Laptop Ajustable Aluminio",
        "sku": "SOP-LAP-ALU",
        "description": "Soporte ergonómico para portátil, 6 niveles de altura, plegable y portátil, compatible con laptops de 10\"-17\". Mejora la postura y ventilación.",
        "wholesale_cost": 15000,
        "sale_price": 45000,
        "stock_qty": 35,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80",
    },

    # ─── CELULARES Y ACCESORIOS ────────────────────────────────────────────
    {
        "category": "celulares",
        "name": "Forro iPhone 15 Pro Max MagSafe Militar",
        "sku": "FOR-IP15PM-MAG",
        "description": "Funda ultra resistente certificada militar MIL-STD-810G, compatible MagSafe, bordes de parachoques TPU suave, protección cámara elevada.",
        "wholesale_cost": 8000,
        "sale_price": 35000,
        "stock_qty": 60,
        "min_margin_percent": 30,
        "image_url": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80",
    },
    {
        "category": "celulares",
        "name": "Vidrio Templado iPhone 15 Pro (Pack 3)",
        "sku": "VID-IP15P-3PK",
        "description": "Protector de pantalla vidrio templado 9H, anti-luz azul, instalación sin burbujas con marco guía incluido. Pack de 3 unidades.",
        "wholesale_cost": 4000,
        "sale_price": 18000,
        "stock_qty": 80,
        "min_margin_percent": 20,
        "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
    },
    {
        "category": "celulares",
        "name": "Cargador Inalámbrico MagSafe 15W",
        "sku": "CARG-MAG-15W",
        "description": "Cargador inalámbrico magnético 15W para iPhone 12/13/14/15, compatible con Apple Watch y AirPods. LED indicador, cable USB-C 1m incluido.",
        "wholesale_cost": 14000,
        "sale_price": 45000,
        "stock_qty": 40,
        "min_margin_percent": 28,
        "image_url": "https://images.unsplash.com/photo-1628815113969-0487917e8b76?w=400&q=80",
    },
    {
        "category": "celulares",
        "name": "Soporte Celular para Auto Magnético",
        "sku": "SOP-CEL-MAG",
        "description": "Soporte vehicular magnético 360° para rejilla de ventilación, compatible con todos los celulares incluyendo iPhone y Samsung. Imán N52 ultrafuerte.",
        "wholesale_cost": 7000,
        "sale_price": 25000,
        "stock_qty": 55,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80",
    },
    {
        "category": "celulares",
        "name": "Batería Portátil 20000mAh Carga Rápida",
        "sku": "BAT-PORT-20K",
        "description": "Power bank 20000mAh con carga rápida 22.5W, 4 salidas (2× USB-A + USB-C + Micro), pantalla LED de nivel de batería, carga inalámbrica 10W.",
        "wholesale_cost": 30000,
        "sale_price": 89000,
        "stock_qty": 22,
        "min_margin_percent": 30,
        "image_url": "https://images.unsplash.com/photo-1609592424049-8c3c1ffd3157?w=400&q=80",
    },
    {
        "category": "celulares",
        "name": "Audífonos Correa para Cuello Deportivos",
        "sku": "AUD-NECK-DEP",
        "description": "Auriculares neckband Bluetooth 5.3, 15 horas de reproducción, resistente al sudor IPX7, micrófono CVC 8.0 para llamadas HD. Ideales para ejercicio.",
        "wholesale_cost": 16000,
        "sale_price": 52000,
        "stock_qty": 28,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=400&q=80",
    },

    # ─── HOGAR ─────────────────────────────────────────────────────────────
    {
        "category": "hogar",
        "name": "Bombillo LED Inteligente RGB WiFi",
        "sku": "BOMB-LED-RGB",
        "description": "Bombillo inteligente 10W, 16 millones de colores, control por voz (Alexa/Google), programable por app. Compatible con E27. Sin hub necesario.",
        "wholesale_cost": 12000,
        "sale_price": 38000,
        "stock_qty": 45,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    },
    {
        "category": "hogar",
        "name": "Enchufe Inteligente WiFi con Monitor de Energía",
        "sku": "ENCH-WIFI-MON",
        "description": "Smart plug con monitoreo de consumo eléctrico en tiempo real, temporizador, control remoto por app. Compatible con Alexa, Google Home y Apple HomeKit.",
        "wholesale_cost": 15000,
        "sale_price": 45000,
        "stock_qty": 30,
        "min_margin_percent": 25,
        "image_url": "https://images.unsplash.com/photo-1585771732489-71a1c68afe28?w=400&q=80",
    },

    # ─── MODA ──────────────────────────────────────────────────────────────
    {
        "category": "moda",
        "name": "Mochila Antiguas Laptop 15.6\" Impermeable",
        "sku": "MOC-ANTI-15",
        "description": "Mochila urbana resistente al agua con puerto USB de carga externo, compartimento acolchado para laptop 15.6\", espacio organizador expandible.",
        "wholesale_cost": 35000,
        "sale_price": 99000,
        "stock_qty": 15,
        "min_margin_percent": 30,
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    },
]


class Command(BaseCommand):
    help = "Crea productos de demostración para el nicho tecnología"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Elimina todos los productos y categorías antes de crear",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING("⚠️  Datos anteriores eliminados"))

        # Crear/obtener categorías
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "is_active": True,
                    "is_visible": True,
                },
            )
            cat_map[cat_data["slug"]] = cat
            status = "✅ Creada" if created else "⚠️  Ya existe"
            self.stdout.write(f"  {status} categoría: {cat.name}")

        # Crear productos
        created_count = 0
        for p_data in PRODUCTS:
            cat = cat_map.get(p_data["category"])
            if not cat:
                self.stdout.write(self.style.ERROR(f"  ❌ Categoría no encontrada: {p_data['category']}"))
                continue

            if Product.objects.filter(sku=p_data["sku"]).exists():
                self.stdout.write(f"  ⚠️  Ya existe: {p_data['name']}")
                continue

            product = Product(
                category=cat,
                name=p_data["name"],
                sku=p_data["sku"],
                description=p_data["description"],
                wholesale_cost=p_data["wholesale_cost"],
                sale_price=p_data["sale_price"],
                stock_qty=p_data["stock_qty"],
                min_margin_percent=p_data.get("min_margin_percent", 25),
                is_discountable=True,
                is_active=True,
            )

            # Descargar imagen
            img_url = p_data.get("image_url")
            if img_url:
                try:
                    req = urllib.request.Request(
                        img_url,
                        headers={"User-Agent": "Mozilla/5.0"},
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        img_data = response.read()
                    filename = f"{p_data['sku'].lower()}.jpg"
                    product.image.save(filename, ContentFile(img_data), save=False)
                    self.stdout.write(f"  📸 Imagen descargada: {filename}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  ⚠️  No se pudo descargar imagen de {p_data['name']}: {e}"))

            product.save()
            created_count += 1
            margin = ((p_data["sale_price"] - p_data["wholesale_cost"]) / p_data["sale_price"]) * 100
            self.stdout.write(
                self.style.SUCCESS(f"  ✅ {p_data['name']} | Margen: {margin:.0f}%")
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n🎉 ¡Listo! {created_count} productos creados correctamente."
            )
        )
