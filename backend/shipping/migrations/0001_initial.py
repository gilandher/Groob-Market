"""
Migracion inicial de la app shipping.
Crea la tabla TarifaEnvio y carga los datos iniciales
de los municipios con entrega local (mismo dia).
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="TarifaEnvio",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("municipio",   models.CharField(max_length=80, unique=True, verbose_name="Municipio")),
                ("tipo",        models.CharField(choices=[("LOCAL","Mismo dia (local)"),("NACIONAL","Nacional (transportadora)")], max_length=20, verbose_name="Tipo de envio")),
                ("costo",       models.PositiveIntegerField(verbose_name="Costo envio (COP)")),
                ("dias_habil",  models.PositiveSmallIntegerField(default=0, help_text="0 = mismo dia", verbose_name="Dias habiles de entrega")),
                ("esta_activo", models.BooleanField(default=True, verbose_name="Activo")),
            ],
            options={
                "verbose_name":        "Tarifa de envio",
                "verbose_name_plural": "Tarifas de envio",
                "ordering":            ["tipo", "municipio"],
            },
        ),
        # Datos iniciales — municipios con entrega el mismo dia
        migrations.RunSQL(
            sql="""
                INSERT INTO shipping_tarifaenvio (municipio, tipo, costo, dias_habil, esta_activo) VALUES
                ('Bello',    'LOCAL', 4000, 0, 1),
                ('Medellin', 'LOCAL', 5000, 0, 1),
                ('Itagui',   'LOCAL', 6000, 0, 1),
                ('Envigado', 'LOCAL', 7000, 0, 1),
                ('Sabaneta', 'LOCAL', 7000, 0, 1);
            """,
            reverse_sql="DELETE FROM shipping_tarifaenvio;",
        ),
    ]
