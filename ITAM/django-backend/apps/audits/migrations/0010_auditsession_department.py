from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("audits", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditsession",
            name="department",
            field=models.CharField(
                blank=True,
                help_text="Limit audit to a specific department (optional)",
                max_length=255,
            ),
        ),
    ]
