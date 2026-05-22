import os
import shutil
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Product

# Source images paths
src_images = {
    'cargador_iphone': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\cargador_iphone_1779384232604.png',
    'forro_iphone_17': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\forro_iphone_17_1779384186530.png',
    'cable_tipo_c': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\cable_tipo_c_1779384252966.png',
    'vidrio_xiaomi': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\vidrio_xiaomi_1779384212336.png',
    'audifonos_inalambricos': r'C:\Users\Andres Inciarte\.gemini\antigravity-ide\brain\f770475f-eb3d-482d-89cf-6dbc30450653\audifonos_inalambricos_1779384276916.png'
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

# 2. Update DB
updates = [
    ('Cargador iPhone', 'products/cargador_iphone.png'),
    ('Forro iPhone 17 Pro Max', 'products/forro_iphone_17.png'),
    ('Cable cargador Tipo C', 'products/cable_tipo_c.png'),
    ('Vidrio blindado Xiaomi', 'products/vidrio_xiaomi.png'),
    ('Audífonos inalámbricos', 'products/audifonos_inalambricos.png')
]

for prod_name, img_rel_path in updates:
    try:
        p = Product.objects.get(name=prod_name)
        p.image = img_rel_path
        p.save()
        print(f"Updated product '{prod_name}' with image '{img_rel_path}'")
    except Product.DoesNotExist:
        print(f"Product '{prod_name}' not found in DB")
