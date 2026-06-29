from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assets", "0008_asset_depreciation_method_asset_residual_value_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="assetstatushistory",
            name="change_type",
            field=models.CharField(
                choices=[
                    ("status", "Status Change"),
                    ("field", "Field Update"),
                    ("create", "Created"),
                    ("location", "Location Change"),
                ],
                db_index=True,
                default="status",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="assetstatushistory",
            name="field_name",
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name="assetstatushistory",
            name="old_value",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="assetstatushistory",
            name="new_value",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="assetstatushistory",
            name="from_status",
            field=models.CharField(blank=True, choices=[("available", "Available"), ("ready", "Ready"), ("assigned", "Assigned"), ("in-use", "In Use"), ("maintenance", "Maintenance"), ("returned", "Returned"), ("retired", "Retired"), ("disposed", "Disposed"), ("lost", "Lost"), ("stolen", "Stolen")], max_length=32),
        ),
        migrations.AlterField(
            model_name="assetstatushistory",
            name="to_status",
            field=models.CharField(blank=True, choices=[("available", "Available"), ("ready", "Ready"), ("assigned", "Assigned"), ("in-use", "In Use"), ("maintenance", "Maintenance"), ("returned", "Returned"), ("retired", "Retired"), ("disposed", "Disposed"), ("lost", "Lost"), ("stolen", "Stolen")], max_length=32),
        ),
        migrations.AlterField(
            model_name="assetstatushistory",
            name="changed_at",
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name="assetstatushistory",
            name="changed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="asset_changes_made",
                to="users.user",
            ),
        ),
        migrations.AlterField(
            model_name="assetstatushistory",
            name="reason",
            field=models.TextField(blank=True, help_text="Reason for change"),
        ),
    ]
