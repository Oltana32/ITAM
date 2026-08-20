from datetime import date

from django.core.management.base import BaseCommand

from apps.licenses.models import SoftwareLicense
from apps.notifications.services import notify_license_expiry


class Command(BaseCommand):
    help = 'Generate license expiry notifications for licenses expiring soon.'

    def handle(self, *args, **options):
        licenses = SoftwareLicense.objects.filter(expiry_date__isnull=False)
        today = date.today()
        count = 0

        for license_obj in licenses:
            days_until_expiry = (license_obj.expiry_date - today).days
            if days_until_expiry <= 90:
                notify_license_expiry(license_obj)
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Processed {count} expiring license(s).'))
