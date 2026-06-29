# Generated migration file

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0002_remove_location_uniq_location_code_when_set_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='city',
            field=models.CharField(
                blank=True,
                choices=[
                    ('addis_ababa', 'Addis Ababa'),
                    ('adama', 'Adama'),
                    ('dire_dawa', 'Dire Dawa'),
                    ('hawassa', 'Hawassa'),
                    ('bahir_dar', 'Bahir Dar'),
                    ('mekelle', 'Mekelle'),
                    ('jimma', 'Jimma'),
                    ('dessie', 'Dessie'),
                    ('gondar', 'Gondar'),
                    ('bishoftu', 'Bishoftu'),
                    ('harar', 'Harar'),
                    ('shashemene', 'Shashemene'),
                    ('nekemte', 'Nekemte'),
                    ('debre_birhan', 'Debre Birhan'),
                    ('assosa', 'Assosa'),
                    ('semera', 'Semera'),
                    ('jigjiga', 'Jigjiga'),
                    ('arba_minch', 'Arba Minch')
                ],
                max_length=32
            ),
        ),
    ]
