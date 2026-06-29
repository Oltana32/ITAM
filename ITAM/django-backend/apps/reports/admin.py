from django.contrib import admin

from .models import SavedReport


@admin.register(SavedReport)
class SavedReportAdmin(admin.ModelAdmin):
    list_display = ("name", "report_type", "user", "is_shared", "updated_at")
    list_filter = ("report_type", "is_shared")
    search_fields = ("name", "user__email")
    raw_id_fields = ("user",)
