from django.contrib import admin

from .models import Manufacturer


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ("name", "support_email", "website")
    search_fields = ("name", "contact_info", "support_email")
