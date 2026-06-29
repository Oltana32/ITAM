from django.contrib import admin

from .models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("asset", "assigned_to_name", "assigner", "assigned_date", "actual_return_date", "status")
    list_filter = ("status", "assigned_date", "actual_return_date")
    search_fields = ("asset__tag", "assigned_to_name", "assigner__email", "employee_id")
    raw_id_fields = ("asset", "assigner", "assigned_to_user", "created_by", "updated_by")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "assigned_date"