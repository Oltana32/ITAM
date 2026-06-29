"""Alter assigned_to from CharField to ForeignKey to AUTH_USER_MODEL.

This migration converts the Asset.assigned_to field from a plain CharField
to a ForeignKey pointing to the configured user model. The field is made
nullable and will be SET_NULL on user deletion.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("assets", "0005_alter_asset_status"),
    ]

    def set_empty_assigned_to_null(apps, schema_editor):
        Asset = apps.get_model('assets', 'Asset')
        Asset.objects.all().update(assigned_to=None)

    operations = [
        migrations.AlterField(
            model_name="asset",
            name="assigned_to",
            field=models.CharField(max_length=255, null=True, blank=True),
        ),

        migrations.RunPython(
            set_empty_assigned_to_null,
            migrations.RunPython.noop,
        ),

        migrations.AlterField(
            model_name="asset",
            name="assigned_to",
            field=models.ForeignKey(
                to=settings.AUTH_USER_MODEL,
                null=True,
                blank=True,
                related_name="assigned_assets",
                on_delete=django.db.models.deletion.SET_NULL,
            ),
        ),
    ]