# django-backend/apps/assignments/apps.py

from django.apps import AppConfig


class AssignmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.assignments'
    
    def ready(self):
        # Temporarily disabled while we fix the models
        # from . import signals  # noqa: F401
        pass