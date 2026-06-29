# Generated migration file

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('asset_assigned', 'Asset Assigned'),
                    ('asset_returned', 'Asset Returned'),
                    ('asset_retired', 'Asset Retired'),
                    ('asset_disposed', 'Asset Disposed'),
                    ('maintenance_created', 'Maintenance Created'),
                    ('maintenance_completed', 'Maintenance Completed'),
                    ('license_expiry', 'License Nearing Expiry')
                ],
                default='asset_assigned',
                max_length=32
            ),
        ),
        migrations.AddField(
            model_name='notification',
            name='related_asset_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='related_assignment_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='related_maintenance_id',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
