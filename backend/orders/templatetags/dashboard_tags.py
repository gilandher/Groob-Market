import json
from datetime import timedelta
from django import template
from django.db.models import Sum, F
from django.utils import timezone
from orders.models import Order, OrderItem
from catalog.models import Product

register = template.Library()

def format_cop(value):
    if not value: return "$0"
    return f"${int(value):,.0f}".replace(",", ".")

@register.simple_tag
def get_dashboard_stats():
    # Órdenes válidas
    valid_status = ['NEW', 'CONFIRMED', 'PACKING', 'ON_THE_WAY', 'LOGISTICS', 'DELIVERED']
    valid_orders = Order.objects.filter(status__in=valid_status)
    
    # 1. Ventas Totales
    total_sales = valid_orders.aggregate(total=Sum('total'))['total'] or 0
    
    # 2. Margen de Ganancia
    valid_items = OrderItem.objects.filter(order__status__in=valid_status)
    revenue = valid_items.aggregate(t=Sum(F('qty') * F('unit_price')))['t'] or 0
    cost = valid_items.aggregate(t=Sum(F('qty') * F('unit_cost')))['t'] or 0
    profit = revenue - cost
    
    # 3. Pedidos Activos (Riesgo)
    active_count = Order.objects.filter(status__in=['NEW', 'CONFIRMED', 'PACKING']).count()
    
    # 4. Total Histórico
    total_orders_count = Order.objects.count()

    # 5. Inventario en Riesgo
    out_of_stock_count = Product.objects.filter(stock_qty__lte=0).count()

    # == NUEVO: INTELIGENCIA DE NEGOCIOS ==
    
    # A) Tendencia Últimos 7 Días
    now = timezone.now()
    chart_labels = []
    chart_data = []
    
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_total = valid_orders.filter(
            created_at__date=day.date()
        ).aggregate(Sum('total'))['total__sum'] or 0
        
        chart_labels.append(day.strftime("%d %b"))
        chart_data.append(int(day_total))

    # B) Top 5 Productos Estrella (Mejores Ingresos Brutos)
    top_products_qs = valid_items.values(
        'product_name', 'product_sku'
    ).annotate(
        total_revenue=Sum(F('qty') * F('unit_price')),
        total_qty=Sum('qty')
    ).order_by('-total_revenue')[:5]

    top_products = []
    for tp in top_products_qs:
        top_products.append({
            'name': tp['product_name'],
            'sku': tp['product_sku'],
            'qty': tp['total_qty'],
            'revenue_fmt': format_cop(tp['total_revenue'])
        })

    return {
        'total_sales': format_cop(total_sales),
        'profit': format_cop(profit),
        'active_count': active_count,
        'total_orders_count': total_orders_count,
        'out_of_stock_count': out_of_stock_count,
        
        # Data for Chart.js
        'chart_labels': chart_labels,
        'chart_data': chart_data,
        
        # Bestsellers
        'top_products': top_products,
    }
