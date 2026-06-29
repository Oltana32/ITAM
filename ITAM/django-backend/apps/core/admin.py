"""
Django admin configuration for core app.
Provides admin interface for viewing audit logs.
"""

from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Read-only admin interface for viewing audit logs.
    
    Audit logs are generated automatically and should never be
    manually created, edited, or deleted.
    """
    
    list_display = ('timestamp', 'action', 'content_object', 'user', 'ip_address')
    list_filter = ('action', 'timestamp', 'user', 'content_type')
    search_fields = ('user__email', 'ip_address', 'reason')
    readonly_fields = (
        'timestamp',
        'content_type',
        'object_id',
        'content_object',
        'changes',
        'user',
        'action',
        'reason',
        'ip_address',
    )
    
    def has_add_permission(self, request):
        """Prevent manual creation of audit logs."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of audit logs."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent editing of audit logs."""
        return False