from django.contrib import admin

from .models import MaintenanceRecord


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ("asset", "type", "schedule_date", "status", "technician")
    list_filter = ("type", "status", "schedule_date")
    search_fields = ("asset__tag", "description")
    raw_id_fields = ("asset", "technician")
    date_hierarchy = "schedule_date"
