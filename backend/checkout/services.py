from dataclasses import dataclass
from typing import List, Optional, Tuple

from catalog.models import Product
from promotions.models import Coupon
from shipping.services import buscar_zona


@dataclass
class CartLine:
    product: Product
    qty: int


@dataclass
class DiscountLineResult:
    product_id: int
    name: str
    qty: int
    unit_price: int
    unit_cost: int
    line_subtotal: int

    eligible: bool
    requested_percent: int
    allowed_percent: int
    applied_percent: int

    discount_value: int


def _max_discount_percent_margin_safe(product: Product) -> int:
    """
    Calcula el descuento máximo permitido para no bajar del margen mínimo (%).
    Margin% = (price - cost) / price * 100

    Queremos asegurar:
    (discounted_price - cost) / discounted_price * 100 >= min_margin_percent
    => discounted_price >= cost / (1 - min_margin/100)

    Si discounted_price_min > price => no se puede dar descuento.
    """
    price = int(product.sale_price)
    cost = int(product.wholesale_cost)
    min_margin = int(product.min_margin_percent)

    if price <= 0:
        return 0

    # Si costo >= precio, no hay margen: 0%
    if cost >= price:
        return 0

    # Precio mínimo para respetar margen
    denom = (1 - (min_margin / 100))
    if denom <= 0:
        return 0

    min_allowed_price = int(cost / denom)

    # Si el mínimo permitido ya es >= precio actual, no hay descuento
    if min_allowed_price >= price:
        return 0

    # Descuento máximo = 1 - (min_allowed_price / price)
    max_disc = 1 - (min_allowed_price / price)
    max_percent = int(max_disc * 100)

    # Clamp
    if max_percent < 0:
        return 0
    if max_percent > 90:
        return 90

    return max_percent


def calculate_cart_totals(
    user,
    items: List[dict],
    coupon_code: Optional[str] = None,
    city: Optional[str] = None,
) -> dict:
    """
    Calcula totales del carrito con cupón margin-safe y costo de envío según municipio.
    items: [{product_id, qty}]
    """
    # Construir líneas
    lines: List[CartLine] = []
    for it in items:
        product = Product.objects.get(id=it["product_id"], is_active=True)
        qty = int(it["qty"])
        lines.append(CartLine(product=product, qty=qty))

    subtotal = sum(line.product.sale_price * line.qty for line in lines)

    coupon: Optional[Coupon] = None
    requested_percent = 0

    if coupon_code:
        coupon = Coupon.objects.filter(code=coupon_code, user=user, is_used=False).order_by("-created_at").first()
        if coupon:
            requested_percent = int(coupon.percent)

    discount_lines: List[DiscountLineResult] = []
    discount_total = 0

    for line in lines:
        p = line.product
        line_subtotal = int(p.sale_price) * line.qty

        eligible = bool(p.is_discountable)
        allowed_percent = _max_discount_percent_margin_safe(p) if eligible else 0
        applied_percent = min(requested_percent, allowed_percent) if coupon else 0

        discount_value = int((line_subtotal * applied_percent) / 100)

        discount_lines.append(
            DiscountLineResult(
                product_id=p.id,
                name=p.name,
                qty=line.qty,
                unit_price=int(p.sale_price),
                unit_cost=int(p.wholesale_cost),
                line_subtotal=line_subtotal,
                eligible=eligible,
                requested_percent=requested_percent,
                allowed_percent=allowed_percent,
                applied_percent=applied_percent,
                discount_value=discount_value,
            )
        )

        discount_total += discount_value

    shipping_cost = 0
    if city:
        resultado = buscar_zona(city)
        if resultado:
            _, p, _ = resultado
            if p is not None:
                shipping_cost = p

    total = subtotal - discount_total + shipping_cost

    return {
        "subtotal": int(subtotal),
        "discount_total": int(discount_total),
        "shipping_cost": int(shipping_cost),
        "total": int(total),
        "coupon": {
            "code": coupon.code,
            "percent": coupon.percent,
            "expires_at": coupon.expires_at,
            "first_purchase_only": coupon.first_purchase_only,
        } if coupon else None,
        "lines": [dl.__dict__ for dl in discount_lines],
        "notes": {
            "rule": "Descuento aplicado solo a productos elegibles y recortado automáticamente para respetar margen mínimo.",
        },
    }