import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from catalog.models import Category, Product


class Command(BaseCommand):
    help = "Importa/actualiza productos desde un CSV."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            type=str,
            help="Ruta al archivo CSV (ej: data/productos.csv)",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"])

        if not csv_path.exists():
            self.stderr.write(self.style.ERROR(f"No existe el archivo: {csv_path}"))
            return

        created, updated, errors = 0, 0, 0

        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)

            required_cols = {"category_slug", "name", "sku", "wholesale_cost", "sale_price"}
            if not required_cols.issubset(set(reader.fieldnames or [])):
                self.stderr.write(
                    self.style.ERROR(
                        f"CSV inválido. Debe incluir columnas: {sorted(required_cols)}"
                    )
                )
                return

            for row in reader:
                try:
                    category_slug = row["category_slug"].strip()
                    category = Category.objects.get(slug=category_slug)

                    defaults = {
                        "category": category,
                        "name": row["name"].strip(),
                        "description": row.get("description", "").strip(),
                        "wholesale_cost": int(row["wholesale_cost"]),
                        "sale_price": int(row["sale_price"]),
                        "stock_qty": int(row.get("stock_qty", 0)),
                        "is_discountable": row.get("is_discountable", "true").strip().lower() == "true",
                        "min_margin_percent": int(row.get("min_margin_percent", 25)),
                        "is_active": row.get("is_active", "true").strip().lower() == "true",
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

        self.stdout.write(
            self.style.SUCCESS(
                f"Importación terminada ✅ Creados: {created} | Actualizados: {updated} | Errores: {errors}"
            )
        )