from django.apps import AppConfig


class CheckoutConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "checkout"
    verbose_name = "Pagos / Checkout"  # ← Nombre que aparece en el admin