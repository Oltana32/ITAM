from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Location",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("code", models.CharField(blank=True, db_index=True, max_length=64)),
                ("building", models.CharField(blank=True, max_length=255)),
                ("floor", models.CharField(blank=True, max_length=64)),
                ("room", models.CharField(blank=True, max_length=64)),
                ("address", models.TextField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.SET_NULL,
                        related_name="children",
                        to="locations.location",
                    ),
                ),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddConstraint(
            model_name="location",
            constraint=models.UniqueConstraint(
                condition=~Q(code=""),
                fields=("code",),
                name="uniq_location_code_when_set",
            ),
        ),
    ]
