from django.contrib import admin

from .models import Asset, AssetStatusHistory


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("tag", "name", "status", "category", "manufacturer", "location", "updated_at")
    list_filter = ("status", "category", "condition")
    search_fields = ("name", "tag", "serial_number", "model", "department")
    raw_id_fields = ("manufacturer", "location", "created_by", "updated_by")
    readonly_fields = ("created_at", "updated_at", "tag")


@admin.register(AssetStatusHistory)
class AssetStatusHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "asset",
        "change_type",
        "field_name",
        "old_value",
        "new_value",
        "changed_at",
        "changed_by",
    )
    list_filter = ("change_type", "field_name", "from_status", "to_status", "changed_at")
    search_fields = ("asset__name", "asset__tag", "reason", "old_value", "new_value")
    raw_id_fields = ("asset", "changed_by")
    readonly_fields = (
        "asset",
        "change_type",
        "field_name",
        "old_value",
        "new_value",
        "from_status",
        "to_status",
        "changed_at",
        "changed_by",
        "reason",
    )
    
    def has_add_permission(self, request):
        """Prevent manual creation of status history."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of status history."""
        return False