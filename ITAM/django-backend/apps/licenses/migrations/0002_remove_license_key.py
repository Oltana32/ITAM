# Generated migration file

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('licenses', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='softwarelicense',
            name='key',
        ),
        migrations.AlterField(
            model_name='softwarelicense',
            name='vendor',
            field=models.CharField(
                choices=[
                    ('microsoft', 'Microsoft'),
                    ('adobe', 'Adobe'),
                    ('oracle', 'Oracle'),
                    ('sap', 'SAP'),
                    ('autodesk', 'Autodesk'),
                    ('vmware', 'VMware'),
                    ('cisco', 'Cisco'),
                    ('ibm', 'IBM'),
                    ('google', 'Google'),
                    ('atlassian', 'Atlassian'),
                    ('red_hat', 'Red Hat'),
                    ('jetbrains', 'JetBrains'),
                    ('zoho', 'Zoho'),
                    ('salesforce', 'Salesforce'),
                    ('other', 'Other')
                ],
                default='other',
                max_length=32
            ),
        ),
    ]
