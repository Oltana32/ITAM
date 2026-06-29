# django-backend/apps/attachments/admin.py

from django.contrib import admin
from .models import Attachment, AttachmentAccess


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("file_name", "asset", "file_type", "uploaded_by", "uploaded_at", "is_current")
    list_filter = ("file_type", "is_current", "uploaded_at")
    search_fields = ("file_name", "title", "asset__tag", "asset__name")
    readonly_fields = ("file_size", "mime_type", "uploaded_at", "version")
    
    fieldsets = (
        ("File Information", {
            "fields": ("asset", "file", "file_name", "file_type", "file_size", "mime_type")
        }),
        ("Details", {
            "fields": ("title", "description")
        }),
        ("Metadata", {
            "fields": ("uploaded_by", "uploaded_at", "version", "is_current", "replaces")
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AttachmentAccess)
class AttachmentAccessAdmin(admin.ModelAdmin):
    list_display = ("attachment", "user", "action", "accessed_at")
    list_filter = ("action", "accessed_at")
    search_fields = ("attachment__file_name", "user__email")
    readonly_fields = ("accessed_at",)
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
