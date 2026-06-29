from django.contrib import admin

from .models import LicenseAssignment, SoftwareLicense


@admin.register(SoftwareLicense)
class SoftwareLicenseAdmin(admin.ModelAdmin):
    list_display = (
        "software_name",
        "seats",
        "allocated_seats",
        "available_seats",
        "expiry_date",
        "assigned_to",
        "vendor",
    )
    search_fields = ("software_name", "vendor", "notes")
    raw_id_fields = ("assigned_to",)
    list_filter = ("expiry_date",)


@admin.register(LicenseAssignment)
class LicenseAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "license",
        "assigned_to_user",
        "asset",
        "assigned_to_name",
        "assigned_at",
        "revoked_at",
    )
    search_fields = (
        "license__software_name",
        "assigned_to_user__email",
        "asset__tag",
        "assigned_to_name",
    )
    raw_id_fields = ("license", "assigned_to_user", "asset")
    list_filter = ("revoked_at",)
