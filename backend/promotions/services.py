import random

# Probabilidades (ajustables)
WHEEL = [
    (0, 55),   # 55% sin descuento
    (5, 25),   # 25%
    (10, 15),  # 15%
    (15, 4),   # 4%
    (25, 1),   # 1%
    (50, 0),   # 0 (apagado por ahora)
]


def spin_discount_percent() -> int:
    population = [p for p, w in WHEEL]
    weights = [w for p, w in WHEEL]
    return random.choices(population=population, weights=weights, k=1)[0]