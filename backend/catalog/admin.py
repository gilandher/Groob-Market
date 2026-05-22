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

    # Configuración de template personalizado
    change_list_template = "admin/catalog/product/change_list.html"

    # Acciones en lista de productos
    actions = [import_products_csv]

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                "importar-csv/",
                self.admin_site.admin_view(self.importar_csv_view),
                name="catalog_product_importar_csv",
            ),
        ]
        return custom_urls + urls

    def importar_csv_view(self, request):
        from django.shortcuts import render
        from django.http import JsonResponse
        from django.db import transaction
        from django.utils.text import slugify
        from django.utils import timezone
        import json
        import base64
        from django.core.files.base import ContentFile
        from django.core.exceptions import ValidationError as DjangoValidationError
        from .models import Category, Product

        # Si es POST, procesamos la importación masiva vía AJAX
        if request.method == "POST":
            try:
                data = json.loads(request.body)
                products_data = data.get("products", [])
                if not products_data:
                    return JsonResponse(
                        {"detail": "No se encontraron productos para importar."},
                        status=400,
                    )

                created_count = 0
                updated_count = 0

                with transaction.atomic():
                    for item in products_data:
                        name = item.get("name", "").strip()
                        sku = item.get("sku", "").strip()
                        category_name = item.get("category_name", "").strip()
                        description = item.get("description", "").strip()
                        
                        try:
                            wholesale_cost = int(item.get("wholesale_cost", 0))
                            sale_price = int(item.get("sale_price", 0))
                            stock_qty = int(item.get("stock_qty", 0))
                            discount_percent = int(item.get("discount_percent", 0))
                            min_margin_percent = int(item.get("min_margin_percent", 25))
                        except (ValueError, TypeError):
                            return JsonResponse({"detail": "Los precios, stock y porcentajes deben ser números válidos."}, status=400)

                        is_active = item.get("is_active", True)
                        image_base64 = item.get("image_base64", None)

                        if not name or not sku or not category_name:
                            return JsonResponse({"detail": "El nombre, SKU y Categoría son campos obligatorios."}, status=400)

                        # Buscar o crear categoría
                        category = Category.objects.filter(name__iexact=category_name).first()
                        if not category:
                            category = Category.objects.create(
                                name=category_name,
                                slug=slugify(category_name),
                                is_active=True,
                                is_visible=True
                            )

                        # Buscar o crear producto por SKU
                        product = Product.objects.filter(sku=sku).first()
                        if product:
                            updated_count += 1
                        else:
                            product = Product(sku=sku)
                            created_count += 1

                        product.name = name
                        product.category = category
                        product.description = description
                        product.wholesale_cost = wholesale_cost
                        product.sale_price = sale_price
                        product.stock_qty = stock_qty
                        product.is_active = is_active
                        product.discount_percent = discount_percent
                        product.min_margin_percent = min_margin_percent

                        # Procesar imagen en base64
                        if image_base64:
                            try:
                                if ";base64," in image_base64:
                                    format_part, img_str = image_base64.split(';base64,')
                                    ext = format_part.split('/')[-1]
                                    if ext not in ['jpeg', 'jpg', 'png', 'webp', 'svg+xml']:
                                        ext = 'png'
                                    if ext == 'svg+xml':
                                        ext = 'svg'
                                else:
                                    img_str = image_base64
                                    ext = 'png'

                                img_data = base64.b64decode(img_str)
                                filename = f"{sku}_{int(timezone.now().timestamp())}.{ext}"
                                product.image.save(filename, ContentFile(img_data), save=False)
                            except Exception as decode_err:
                                return JsonResponse({"detail": f"Error decodificando imagen de {name}: {str(decode_err)}"}, status=400)

                        # Validaciones del modelo
                        try:
                            product.full_clean()
                            product.save()
                        except DjangoValidationError as val_err:
                            err_msg = val_err.message_dict if hasattr(val_err, 'message_dict') else str(val_err)
                            return JsonResponse({"detail": f"Error de validación en {name}: {str(err_msg)}"}, status=400)

                return JsonResponse({
                    "detail": f"Importación exitosa. Creados: {created_count}, Actualizados: {updated_count}.",
                    "created": created_count,
                    "updated": updated_count
                })

            except Exception as e:
                return JsonResponse({"detail": f"Error interno: {str(e)}"}, status=500)

        # Si es GET, mostramos la interfaz del importador
        categories = Category.objects.filter(is_active=True).order_by("name")
        categories_data = [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]
        
        context = {
            **self.admin_site.each_context(request),
            "title": "Importador de Catálogo de Productos",
            "opts": self.model._meta,
            "categories_json": json.dumps(categories_data),
        }
        return render(request, "admin/catalog/product/importar_csv.html", context)

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