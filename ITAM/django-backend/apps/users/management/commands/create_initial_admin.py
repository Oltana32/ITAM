import os

from django.core.management.base import BaseCommand

from apps.users.models import User


class Command(BaseCommand):
    help = "Create or update the initial ITAM admin user"

    def handle(self, *args, **options):
        email = os.environ.get("DJANGO_ADMIN_EMAIL", "admin@test.com")
        password = os.environ.get("DJANGO_ADMIN_PASSWORD", "Admin@123")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "username": "admin",
            },
        )

        user.role = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if not user.username:
            user.username = "admin"
        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Admin user ready: {email} / {password}"
            )
        )

        if created:
            self.stdout.write(self.style.SUCCESS("Initial admin user created."))
        else:
            self.stdout.write(self.style.SUCCESS("Initial admin user updated."))