import os

from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = "Create or update the initial ITAM admin user"

    def handle(self, *args, **options):
        email = os.environ.get("DJANGO_ADMIN_EMAIL")
        password = os.environ.get("DJANGO_ADMIN_PASSWORD")

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    "DJANGO_ADMIN_EMAIL or DJANGO_ADMIN_PASSWORD is not set. "
                    "Skipping admin creation."
                )
            )
            return

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        user.role = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Initial admin user created: {email}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Initial admin user updated: {email}"
                )
            )