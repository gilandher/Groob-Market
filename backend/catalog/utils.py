def format_cop(value: int) -> str:
    """
    Formatea un entero COP: 30000 -> '$ 30.000'
    (Se usa en el Admin para mostrar precios legibles.)
    """
    try:
        return "$ " + f"{int(value):,}".replace(",", ".")
    except Exception:
        return "$ 0"