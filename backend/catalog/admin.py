import csv
from io import TextIOWrapper

from django.contrib import admin, messages
from django.utils.html import format_html

from .models import Category, Product
from .utils import format_cop


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin de categorías.
    - is_visible permite ocultar categorías que están 'Próximamente'
    """
    list_display = ("name", "slug", "is_active", "is_visible")
    list_filter = ("is_active", "is_visible")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.action(description="Importar productos desde CSV (se sube como archivo)")
def import_products_csv(modeladmin, request, queryset):
    """
    Acción de Admin para importar/actualizar productos desde un CSV.
    IMPORTANTE:
    - El CSV se debe subir como archivo en el admin (en un paso adicional).
    - Esta acción funciona mejor con una vista custom; por ahora dejamos el motor listo.
    - Si no hay archivo, muestra un mensaje.

    Columnas esperadas (headers):
    category_slug,name,sku,description,wholesale_cost,sale_price,stock_qty,is_discountable,min_margin_percent,is_active
    """
    if "csv_file" not in request.FILES:
        messages.error(
            request,
            "Debes subir el archivo CSV con el nombre de campo 'csv_file'. "
            "Recomendación: usemos el comando de importación (más fácil).",
        )
        return

    csv_file = request.FILES["csv_file"]
    wrapper = TextIOWrapper(csv_file.file, encoding="utf-8")
    reader = csv.DictReader(wrapper)

    created, updated, errors = 0, 0, 0

    for row in reader:
        try:
            category_slug = row["category_slug"].strip()
            cat = Category.objects.get(slug=category_slug)

            defaults = {
                "category": cat,
                "name": row["name"].strip(),
                "description": row.get("description", "").strip(),
                "wholesale_cost": int(row["wholesale_cost"]),
                "sale_price": int(row["sale_price"]),
                "stock_qty": int(row.get("stock_qty", 0)),
                "is_discountable": row.get("is_discountable", "true").lower() == "true",
                "min_margin_percent": int(row.get("min_margin_percent", 25)),
                "is_active": row.get("is_active", "true").lower() == "true",
            }

            obj, was_created = Product.objects.update_or_create(
                sku=row["sku"].strip(),
                defaults=defaults,
            )

            if was_created:
                created += 1
            else:
                updated += 1

        except Exception:
            errors += 1

    messages.success(
        request,
        f"Importación terminada ✅ Creados: {created} | Actualizados: {updated} | Errores: {errors}",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Admin de productos con:
    - valores formateados COP
    - margen % y ganancia por unidad
    - alertas visuales si el margen es bajo
    """
    list_display = (
        "name",
        "sku",
        "category",
        "sale_price_cop",
        "wholesale_cost_cop",
        "profit_per_unit_cop",
        "margin_percent_display",
        "stock_qty",
        "is_active",
        "is_discountable",
    )
    list_filter = ("category", "is_active", "is_discountable")
    search_fields = ("name", "sku")
    ordering = ("category", "name")

    # Acciones en lista de productos
    actions = [import_products_csv]

    # --- Mostrar COP bonito ---
    @admin.display(description="Precio venta")
    def sale_price_cop(self, obj: Product) -> str:
        return format_cop(obj.sale_price)

    @admin.display(description="Costo mayorista")
    def wholesale_cost_cop(self, obj: Product) -> str:
        return format_cop(obj.wholesale_cost)

    # --- Ganancia por unidad ---
    @admin.display(description="Ganancia/unidad")
    def profit_per_unit_cop(self, obj: Product) -> str:
        profit = obj.sale_price - obj.wholesale_cost
        return format_cop(profit)

    # --- Margen % con semáforo ---
    @admin.display(description="Margen (%)")
    def margin_percent_display(self, obj: Product) -> str:
        """
        Margen = (precio - costo) / precio * 100
        Mostramos con color:
        - rojo si < 25%
        - naranja si 25-35%
        - verde si >= 35%
        """
        if obj.sale_price <= 0:
            return "0%"

        margin = ((obj.sale_price - obj.wholesale_cost) / obj.sale_price) * 100
        margin_round = round(margin, 1)

        if margin < 25:
            color = "#DC2626"  # rojo
        elif margin < 35:
            color = "#F59E0B"  # naranja
        else:
            color = "#16A34A"  # verde

        return format_html('<b style="color:{};">{}%</b>', color, margin_round)