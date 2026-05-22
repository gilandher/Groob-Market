import os
import shutil
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Product

# Source images paths (newly generated in this turn)
src_images = {
    'cargador_iphone_20w': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\cargador_iphone_20w_1779386935521.png',
    'audifonos_tws_pro': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\audifonos_tws_pro_1779386956040.png',
    'cable_tipo_c_trenzado': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\cable_tipo_c_trenzado_1779386979469.png',
    'smartwatch_fitness_pro': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\smartwatch_fitness_pro_1779386995872.png',
    'teclado_mecanico_rgb': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\teclado_mecanico_rgb_1779387013857.png',
    'mouse_ergonomico': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\mouse_ergonomico_1779387030982.png',
    'hub_usb_c_7en1': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\hub_usb_c_7en1_1779387047874.png',
    'soporte_laptop': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\soporte_laptop_1779387074189.png',
    'forro_iphone_15': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\forro_iphone_15_1779387091399.png',
    'vidrio_iphone_15': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\vidrio_iphone_15_1779387108581.png',
    'cargador_magsafe_15w': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\cargador_magsafe_15w_1779387127061.png'
}

dest_dir = r'c:\Users\Andres Inciarte\Documents\groob\groob-market\backend\media\products'

# Ensure directory exists
os.makedirs(dest_dir, exist_ok=True)

# 1. Copy images
for name, path in src_images.items():
    if os.path.exists(path):
        dest_path = os.path.join(dest_dir, f"{name}.png")
        shutil.copy(path, dest_path)
        print(f"Copied {path} to {dest_path}")
    else:
        print(f"Source file not found: {path}")

# 2. Update DB by SKU or Name
updates = [
    ('Cargador iPhone 20W USB-C Original', 'products/cargador_iphone_20w.png'),
    ('Audífonos Bluetooth TWS Pro Max', 'products/audifonos_tws_pro.png'),
    ('Cable de Carga Tipo C (2m Trenzado)', 'products/cable_tipo_c_trenzado.png'),
    ('SmartWatch Fitness Pro Serie 8', 'products/smartwatch_fitness_pro.png'),
    ('Teclado Mecánico Gaming RGB', 'products/teclado_mecanico_rgb.png'),
    ('Mouse Inalámbrico Silencioso Ergonómico', 'products/mouse_ergonomico.png'),
    ('Hub USB-C 7 en 1 (HDMI 4K + SD + USB)', 'products/hub_usb_c_7en1.png'),
    ('Soporte Laptop Ajustable Aluminio', 'products/soporte_laptop.png'),
    ('Forro iPhone 15 Pro Max MagSafe Militar', 'products/forro_iphone_15.png'),
    ('Vidrio Templado iPhone 15 Pro (Pack 3)', 'products/vidrio_iphone_15.png'),
    ('Cargador Inalámbrico MagSafe 15W', 'products/cargador_magsafe_15w.png'),
    ('Batería Portátil 20000mAh Carga Rápida', 'products/cargador_iphone_20w.png'), # Placeholder
    ('Enchufe Inteligente WiFi con Monitor de Energía', 'products/cargador_magsafe_15w.png') # Placeholder
]

for prod_name, img_rel_path in updates:
    try:
        p = Product.objects.get(name=prod_name)
        p.image = img_rel_path
        p.save()
        print(f"Updated product '{prod_name}' with image '{img_rel_path}'")
    except Product.DoesNotExist:
        print(f"Product '{prod_name}' not found in DB")
