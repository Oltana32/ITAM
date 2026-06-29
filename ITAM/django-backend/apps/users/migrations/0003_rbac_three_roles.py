
from django.db import migrations, models


def migrate_roles_forward(apps, schema_editor):
    User = apps.get_model("users", "User")
    role_map = {
        "super_admin": "admin",
        "admin": "admin",
        "it_admin": "it_team",
        "it_staff": "it_team",
        "asset_manager": "it_team",
        "department_manager": "it_team",
        "auditor": "it_team",
        "employee": "it_team",
        "user": "it_team",
        "it_team": "it_team",
        "finance": "finance",
    }
    for user in User.objects.all():
        new_role = role_map.get(user.role, "it_team")
        if user.role != new_role:
            user.role = new_role
            user.save(update_fields=["role"])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_alter_user_role"),
    ]

    operations = [
        migrations.RunPython(migrate_roles_forward, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("it_team", "IT Team"),
                    ("finance", "Finance"),
                ],
                db_index=True,
                default="it_team",
                max_length=20,
            ),
        ),
    ]
