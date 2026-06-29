import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SavedReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                (
                    "report_type",
                    models.CharField(
                        choices=[
                            ("asset_inventory", "Asset inventory"),
                            ("assignments", "Assignments"),
                            ("license_expiry", "License expiry"),
                            ("maintenance_due", "Maintenance due"),
                            ("custom", "Custom"),
                        ],
                        db_index=True,
                        max_length=64,
                    ),
                ),
                ("parameters", models.JSONField(blank=True, default=dict)),
                ("is_shared", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="saved_reports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-updated_at"]},
        ),
    ]
