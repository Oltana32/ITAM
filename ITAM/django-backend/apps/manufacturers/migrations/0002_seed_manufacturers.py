from django.db import migrations


def create_manufacturers(apps, schema_editor):
    Manufacturer = apps.get_model('manufacturers', 'Manufacturer')
    manufacturer_names = [
        'Apple',
        'Dell',
        'HP',
        'Lenovo',
        'Cisco',
        'Samsung',
        'LG',
        'Asus',
        'Acer',
        'Microsoft',
        'IBM',
        'Sony',
        'Toshiba',
        'Huawei',
        'Panasonic',
        'Xerox',
        'Oracle',
        'Google',
        'Amazon',
        'Intel',
    ]
    for name in manufacturer_names:
        Manufacturer.objects.get_or_create(name=name)


def reverse_manufacturers(apps, schema_editor):
    Manufacturer = apps.get_model('manufacturers', 'Manufacturer')
    names_to_remove = [
        'Apple',
        'Dell',
        'HP',
        'Lenovo',
        'Cisco',
        'Samsung',
        'LG',
        'Asus',
        'Acer',
        'Microsoft',
        'IBM',
        'Sony',
        'Toshiba',
        'Huawei',
        'Panasonic',
        'Xerox',
        'Oracle',
        'Google',
        'Amazon',
        'Intel',
    ]
    Manufacturer.objects.filter(name__in=names_to_remove).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('manufacturers', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_manufacturers, reverse_manufacturers),
    ]
