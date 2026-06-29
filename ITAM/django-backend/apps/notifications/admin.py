from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "read_status", "created_at", "message_preview")
    list_filter = ("read_status", "created_at")
    search_fields = ("message", "user__email")
    raw_id_fields = ("user",)

    @admin.display(description="Message")
    def message_preview(self, obj: Notification) -> str:
        return (obj.message[:80] + "…") if len(obj.message) > 80 else obj.message
