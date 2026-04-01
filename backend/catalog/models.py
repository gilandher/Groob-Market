from django.db import models
from django.core.exceptions import ValidationError

class Category(models.Model):
    """
    Categorías del marketplace.
    Hoy activamos Tecnología y dejamos creadas otras como 'Próximamente'.
    """

    name = models.CharField("Nombre", max_length=80, unique=True)
    slug = models.SlugField("Slug", max_length=120, unique=True)
    is_active = models.BooleanField("Activo", default=True)
    is_visible = models.BooleanField("Visible en tienda", default=True)

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    """
    Producto con costo mayorista y precio de venta.
    """
    

    category = models.ForeignKey(
        Category,
        verbose_name="Categoría",
        on_delete=models.PROTECT,
        related_name="products"
    )

    name = models.CharField("Nombre del producto", max_length=140)
    sku = models.CharField("SKU (código interno)", max_length=64, unique=True)
    description = models.TextField("Descripción", blank=True)

    image = models.ImageField("Imagen", upload_to="products/", blank=True, null=True)

    wholesale_cost = models.PositiveIntegerField("Costo mayorista (COP)")
    sale_price = models.PositiveIntegerField("Precio de venta (COP)")

    stock_qty = models.PositiveIntegerField("Stock disponible", default=0)

    is_discountable = models.BooleanField("Permite descuento", default=True)
    min_margin_percent = models.PositiveSmallIntegerField("Margen mínimo (%)", default=25)

    is_active = models.BooleanField("Activo", default=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self) -> str:
        return f"{self.name} ({self.sku})"
    


    def clean(self):
        """
        Validaciones de negocio para evitar datos malos en el admin:
        - sale_price >= wholesale_cost
        - stock_qty no negativo
        - margen mínimo entre 1 y 90 (regla razonable)
        """
        if self.sale_price < self.wholesale_cost:
            raise ValidationError("El precio de venta no puede ser menor que el costo mayorista.")
        
        if self.stock_qty < 0:
            raise ValidationError("El stock no puede ser negativo.")
        
        if not (1 <= self.min_margin_percent <= 90):
            raise ValidationError("El margen mínimo debe estar entre 1% y 90%.")
        
        