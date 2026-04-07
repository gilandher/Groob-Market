import unicodedata
from typing import Tuple, Optional

from .models import TarifaEnvio, MUNICIPIOS_ZONA


def normalizar(text: str) -> str:
    """Minúsculas, sin tildes, sin espacios extra."""
    text = text.strip().lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def buscar_zona(municipio_raw: str) -> Optional[Tuple[str, int, str]]:
    """
    Devuelve (zona, precio, tiempo) o None si no se encuentra.
    Orden de búsqueda:
      1. Tabla TarifaEnvio en BD (configurable desde admin)
      2. Tabla estática MUNICIPIOS_ZONA en models.py
      3. Fallback Nacional si el municipio contiene match parcial
    """
    if not municipio_raw:
        return None

    norm = normalizar(municipio_raw)

    # 1. Buscar en BD (coincidencia exacta normalizada)
    try:
        qs = TarifaEnvio.objects.filter(esta_activo=True)
        for tarifa in qs:
            if normalizar(tarifa.municipio) == norm:
                return tarifa.zona, tarifa.precio, tarifa.tiempo
            # Coincidencia parcial
            if norm in normalizar(tarifa.municipio) or normalizar(tarifa.municipio) in norm:
                return tarifa.zona, tarifa.precio, tarifa.tiempo
    except Exception:
        pass

    # 2. Tabla estática del modelo
    if norm in MUNICIPIOS_ZONA:
        zona, precio, tiempo = MUNICIPIOS_ZONA[norm]
        return zona, precio, tiempo

    # Búsqueda parcial en tabla estática
    for key, (zona, precio, tiempo) in MUNICIPIOS_ZONA.items():
        if key in norm or norm in key:
            return zona, precio, tiempo

    return None
