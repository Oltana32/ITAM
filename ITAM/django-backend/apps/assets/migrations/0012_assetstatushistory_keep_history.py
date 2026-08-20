from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assets", "0011_asset_specs"),
    ]

    operations = [
        migrations.AddField(
            model_name="assetstatushistory",
            name="asset_tag",
            field=models.CharField(
                blank=True,
                help_text="Asset tag at the time of history entry",
                max_length=64,
                default="",
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="assetstatushistory",
            name="asset",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="status_history",
                to="assets.asset",
            ),
        ),
    ]
