import shutil
import os

images_to_copy = {
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\slide_flash_v2_1774589561698.png": r"c:\Users\Andres Inciarte\Documents\groob-market\frontend\public\slide_flash.png",
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\slide_shipping_v2_1774589573729.png": r"c:\Users\Andres Inciarte\Documents\groob-market\frontend\public\slide_shipping.png",
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\slide_brands_v2_1774589588232.png": r"c:\Users\Andres Inciarte\Documents\groob-market\frontend\public\slide_brands.png",
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\slide_secure_v2_1774589602637.png": r"c:\Users\Andres Inciarte\Documents\groob-market\frontend\public\slide_secure.png",
}

print("Copiando NUCLEO de imagenes V2 integradas con los degradados...")
for src, dst in images_to_copy.items():
    if os.path.exists(src):
        shutil.copy(src, dst)
        print(f"✅ Copiada y reemplazada: {os.path.basename(dst)}")
    else:
        print(f"❌ Error: No se encontro la imagen {src}")

print("¡Listo! Las nuevas imagenes V2 ya estan en tu carpeta public.")
