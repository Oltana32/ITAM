from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0003_add_assigned_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='asset',
            name='employee_id',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
