"""
GROOB MARKET − Motor de Descuentos estilo TEMU
================================================
Calcula descuentos personalizados por cliente SIN perder margen.

Estrategias disponibles:
  - FLASH_SALE : descuento temporal (countdown)
  - FIRST_BUY  : primera compra del cliente
  - LOYALTY    : cliente recurrente (N pedidos anteriores)
  - CART_SIZE  : descuento por volumen de carrito
  - SESSION    : descuento por sesión (ej. regresa después de 48 h)
  - RANDOM_WOW : "oferta especial para ti" aleatoria dentro de rango seguro

El precio de descuento NUNCA cae por debajo de:
  floor_price = wholesale_cost × (1 + min_margin_percent / 100)
"""

from __future__ import annotations

import hashlib
import math
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class PriceContext:
    """Todo lo que el motor necesita para calcular el precio final."""
    product_id: int
    sale_price: int          # Precio base en COP (sin descuento)
    wholesale_cost: int      # Costo mayorista en COP
    min_margin_percent: int  # Margen mínimo garantizado (ej. 25)
    is_discountable: bool    # Si el producto acepta descuentos

    # Contexto del cliente (opcional)
    customer_id: Optional[int] = None
    customer_order_count: int = 0  # N pedidos anteriores
    customer_email: Optional[str] = None

    # Contexto de sesión
    session_key: Optional[str] = None
    is_returning_visitor: bool = False

    # Contexto de tiempo
    now: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class PriceResult:
    """Resultado del motor de precios."""
    original_price: int       # Precio de referencia (tachado)
    final_price: int          # Precio final que paga el cliente
    discount_percent: float   # % de descuento real
    floor_price: int          # Precio mínimo (nunca bajamos de aquí)
    margin_percent: float     # Margen real que queda
    strategy: str             # Estrategia aplicada
    label: str                # Etiqueta para la UI (ej. "🔥 Solo hoy")
    badge_color: str          # Color del badge (hex)
    countdown_seconds: Optional[int] = None  # Para flash sales
    savings_cop: int = 0      # COP ahorrados

    @property
    def has_discount(self) -> bool:
        return self.final_price < self.original_price

    def to_dict(self) -> dict:
        return {
            "original_price": self.original_price,
            "final_price": self.final_price,
            "discount_percent": round(self.discount_percent, 1),
            "floor_price": self.floor_price,
            "margin_percent": round(self.margin_percent, 1),
            "strategy": self.strategy,
            "label": self.label,
            "badge_color": self.badge_color,
            "countdown_seconds": self.countdown_seconds,
            "savings_cop": self.savings_cop,
            "has_discount": self.has_discount,
        }


# ---------------------------------------------------------------------------
# Pricing Engine
# ---------------------------------------------------------------------------

class GroobPricingEngine:
    """
    Motor de precios personalizado estilo TEMU.

    Prioridad de estrategias:
      1. FLASH_SALE (si está activa globalmente)
      2. FIRST_BUY  (cliente sin pedidos anteriores)
      3. LOYALTY    (cliente con 3+ pedidos)
      4. SESSION    (visitante recurrente)
      5. CART_SIZE  (se aplicaría desde el carrito)
      6. RANDOM_WOW (para todo lo demás)
    """

    # Configuración de estrategias (ajusta según negocio)
    STRATEGIES = {
        "FLASH_SALE": {
            "max_discount_pct": 40,     # Máx. 40% off
            "label": "🔥 Oferta Flash",
            "color": "#ef4444",
            "duration_minutes": 120,    # Duración del flash
        },
        "FIRST_BUY": {
            "max_discount_pct": 25,
            "label": "🎁 Primera compra",
            "color": "#8b5cf6",
        },
        "LOYALTY": {
            "max_discount_pct": 15,
            "label": "⭐ Cliente VIP",
            "color": "#eab308",
        },
        "SESSION": {
            "max_discount_pct": 12,
            "label": "👋 ¡Volviste!",
            "color": "#3b82f6",
        },
        "RANDOM_WOW": {
            "max_discount_pct": 20,
            "label": "✨ Solo para ti",
            "color": "#f97316",
        },
    }

    def __init__(self, flash_sale_active: bool = False, flash_sale_pct: int = 30):
        self.flash_sale_active = flash_sale_active
        self.flash_sale_pct = flash_sale_pct

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate(self, ctx: PriceContext) -> PriceResult:
        """Calcula el precio final dado el contexto."""
        floor_price = self._floor_price(ctx)

        if not ctx.is_discountable or floor_price >= ctx.sale_price:
            # No room for any discount
            return self._no_discount(ctx, floor_price)

        strategy, raw_pct = self._pick_strategy(ctx)
        cfg = self.STRATEGIES[strategy]

        # Clamp discount so we never break the floor price
        safe_pct = self._safe_discount_pct(
            sale_price=ctx.sale_price,
            floor_price=floor_price,
            requested_pct=raw_pct,
        )

        if safe_pct < 1:
            return self._no_discount(ctx, floor_price)

        final_price = self._apply_discount(ctx.sale_price, safe_pct)
        # Round to nearest 500 COP for nicer price display
        final_price = self._round_cop(final_price)

        margin_pct = (final_price - ctx.wholesale_cost) / final_price * 100

        countdown = None
        if strategy == "FLASH_SALE":
            cfg_dur = self.STRATEGIES["FLASH_SALE"]["duration_minutes"]
            # Countdown resets every `duration_minutes` based on current time
            elapsed = (ctx.now.minute * 60 + ctx.now.second) % (cfg_dur * 60)
            countdown = (cfg_dur * 60) - elapsed

        return PriceResult(
            original_price=ctx.sale_price,
            final_price=final_price,
            discount_percent=safe_pct,
            floor_price=floor_price,
            margin_percent=margin_pct,
            strategy=strategy,
            label=cfg["label"],
            badge_color=cfg["color"],
            countdown_seconds=countdown,
            savings_cop=ctx.sale_price - final_price,
        )

    # ------------------------------------------------------------------
    # Strategy selection
    # ------------------------------------------------------------------

    def _pick_strategy(self, ctx: PriceContext) -> tuple[str, float]:
        """Devuelve (strategy_name, raw_discount_pct)."""

        # 1. Flash sale override
        if self.flash_sale_active:
            return "FLASH_SALE", float(self.flash_sale_pct)

        # 2. First purchase
        if ctx.customer_order_count == 0 and ctx.customer_id is not None:
            return "FIRST_BUY", float(self.STRATEGIES["FIRST_BUY"]["max_discount_pct"])

        # 3. Loyalty (3+ orders)
        if ctx.customer_order_count >= 3:
            pct = min(
                5 + ctx.customer_order_count * 2,
                self.STRATEGIES["LOYALTY"]["max_discount_pct"]
            )
            return "LOYALTY", float(pct)

        # 4. Returning visitor
        if ctx.is_returning_visitor:
            return "SESSION", float(self.STRATEGIES["SESSION"]["max_discount_pct"])

        # 5. Pseudo-random personalizado (determinístico, basado en producto + sesión)
        seed = f"{ctx.product_id}-{ctx.session_key or 'anon'}-{ctx.now.date()}"
        rng = random.Random(int(hashlib.md5(seed.encode()).hexdigest(), 16))
        pct = rng.uniform(5, self.STRATEGIES["RANDOM_WOW"]["max_discount_pct"])
        return "RANDOM_WOW", pct

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _floor_price(self, ctx: PriceContext) -> int:
        """Precio mínimo al que podemos vender y seguir con margen mínimo."""
        return math.ceil(ctx.wholesale_cost * (1 + ctx.min_margin_percent / 100))

    @staticmethod
    def _safe_discount_pct(sale_price: int, floor_price: int, requested_pct: float) -> float:
        """Ajusta el % para no bajar del floor_price."""
        max_possible = (1 - floor_price / sale_price) * 100
        return min(requested_pct, max_possible)

    @staticmethod
    def _apply_discount(price: int, pct: float) -> int:
        return int(price * (1 - pct / 100))

    @staticmethod
    def _round_cop(price: int, step: int = 500) -> int:
        """Redondea al múltiplo de `step` COP más cercano (hacia arriba = seguro)."""
        return math.ceil(price / step) * step

    @staticmethod
    def _no_discount(ctx: PriceContext, floor_price: int) -> PriceResult:
        margin_pct = (ctx.sale_price - ctx.wholesale_cost) / ctx.sale_price * 100
        return PriceResult(
            original_price=ctx.sale_price,
            final_price=ctx.sale_price,
            discount_percent=0.0,
            floor_price=floor_price,
            margin_percent=margin_pct,
            strategy="NONE",
            label="",
            badge_color="",
            countdown_seconds=None,
            savings_cop=0,
        )


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_engine: Optional[GroobPricingEngine] = None


def get_pricing_engine() -> GroobPricingEngine:
    """Retorna el singleton del motor. Configurado desde Django settings."""
    global _engine
    if _engine is None:
        from django.conf import settings  # type: ignore
        flash = getattr(settings, "GROOB_FLASH_SALE_ACTIVE", False)
        flash_pct = getattr(settings, "GROOB_FLASH_SALE_PCT", 30)
        _engine = GroobPricingEngine(
            flash_sale_active=flash,
            flash_sale_pct=flash_pct,
        )
    return _engine
