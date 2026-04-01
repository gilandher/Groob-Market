import shutil
import os

images_to_copy = {
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\groob_logo_profile_1_1774643687774.png": r"c:\Users\Andres Inciarte\Documents\groob-market\Redes_Sociales\logo_opcion_1.png",
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\groob_logo_profile_2_1774643700763.png": r"c:\Users\Andres Inciarte\Documents\groob-market\Redes_Sociales\logo_opcion_2.png",
    r"C:\Users\Andres Inciarte\.gemini\antigravity\brain\462934b9-e678-431a-90dd-c7ccec59d722\groob_logo_profile_3_1774643712874.png": r"c:\Users\Andres Inciarte\Documents\groob-market\Redes_Sociales\logo_opcion_3.png",
}

# Crear la carpeta "Redes_Sociales" si no existe
folder_path = r"c:\Users\Andres Inciarte\Documents\groob-market\Redes_Sociales"
if not os.path.exists(folder_path):
    os.makedirs(folder_path)

print("Copiando propuestas de logos para redes sociales...")
for src, dst in images_to_copy.items():
    if os.path.exists(src):
        shutil.copy(src, dst)
        print(f"✅ Copiada con exito: {os.path.basename(dst)}")
    else:
        print(f"❌ Error: No se encontro la imagen {src}")

print(f"\n¡Listo! Tus logos estan en la carpeta: {folder_path}")
