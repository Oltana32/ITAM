import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("locations", "0001_initial"),
        ("manufacturers", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Asset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("tag", models.CharField(db_index=True, max_length=64, unique=True)),
                ("serial_number", models.CharField(db_index=True, max_length=128, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("in_use", "In use"),
                            ("available", "Available"),
                            ("maintenance", "Maintenance"),
                            ("retired", "Retired"),
                        ],
                        db_index=True,
                        default="available",
                        max_length=32,
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("laptop", "Laptop"),
                            ("desktop", "Desktop"),
                            ("monitor", "Monitor"),
                            ("server", "Server"),
                            ("phone", "Phone"),
                            ("tablet", "Tablet"),
                            ("network", "Network"),
                            ("printer", "Printer"),
                            ("other", "Other"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("model", models.CharField(blank=True, max_length=255)),
                (
                    "condition",
                    models.CharField(
                        choices=[
                            ("excellent", "Excellent"),
                            ("good", "Good"),
                            ("fair", "Fair"),
                            ("poor", "Poor"),
                        ],
                        default="good",
                        max_length=32,
                    ),
                ),
                ("department", models.CharField(blank=True, max_length=255)),
                ("purchase_date", models.DateField(blank=True, null=True)),
                ("purchase_cost", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("warranty_expiry", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("last_audit_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assets_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "location",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="assets",
                        to="locations.location",
                    ),
                ),
                (
                    "manufacturer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="assets",
                        to="manufacturers.manufacturer",
                    ),
                ),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.AddIndex(
            model_name="asset",
            index=models.Index(fields=["status", "category"], name="asset_status_cat_idx"),
        ),
    ]
