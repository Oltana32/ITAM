from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0002_rename_asset_status_cat_idx_assets_asse_status_0f8347_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='asset',
            name='assigned_to',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='asset',
            name='allocated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
