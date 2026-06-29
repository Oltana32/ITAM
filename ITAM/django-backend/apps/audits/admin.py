# django-backend/apps/audits/admin.py

from django.contrib import admin
from .models import AuditSession, AuditFinding, VarianceReport


@admin.register(AuditSession)
class AuditSessionAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "audit_date", "assets_found", "assets_not_found", "created_by")
    list_filter = ("status", "audit_date", "created_at")
    search_fields = ("title", "description", "created_by__email")
    readonly_fields = ("created_at", "updated_at", "started_at", "completed_at")
    filter_horizontal = ("auditors",)
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "description", "status")
        }),
        ("Audit Details", {
            "fields": ("planned_date", "audit_date", "started_at", "completed_at")
        }),
        ("Scope", {
            "fields": ("location", "category")
        }),
        ("Auditors", {
            "fields": ("created_by", "auditors")
        }),
        ("Summary", {
            "fields": ("total_assets_audited", "assets_found", "assets_not_found", "assets_with_issues")
        }),
        ("Metadata", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(AuditFinding)
class AuditFindingAdmin(admin.ModelAdmin):
    list_display = ("asset", "audit_session", "status", "auditor", "verified_at")
    list_filter = ("status", "verified_at", "audit_session")
    search_fields = ("asset__tag", "asset__name", "auditor__email", "notes")
    readonly_fields = ("verified_at",)
    
    fieldsets = (
        ("Finding Details", {
            "fields": ("audit_session", "asset", "status", "notes")
        }),
        ("Auditor Information", {
            "fields": ("auditor", "verified_at")
        }),
        ("Condition Check", {
            "fields": ("current_condition",)
        }),
        ("Location Check", {
            "fields": ("current_location",)
        }),
        ("Evidence", {
            "fields": ("evidence_notes",)
        }),
    )


@admin.register(VarianceReport)
class VarianceReportAdmin(admin.ModelAdmin):
    list_display = ("audit_session", "accuracy_percentage", "total_missing", "generated_by", "generated_at")
    list_filter = ("generated_at", "accuracy_percentage")
    search_fields = ("audit_session__title", "generated_by__email", "notes")
    readonly_fields = ("generated_at",)
    
    fieldsets = (
        ("Audit Reference", {
            "fields": ("audit_session",)
        }),
        ("Summary", {
            "fields": ("total_expected", "total_found", "total_missing", "accuracy_percentage")
        }),
        ("Issues", {
            "fields": ("damaged_count", "condition_issues_count", "location_mismatches_count", "ownership_mismatches_count")
        }),
        ("Report", {
            "fields": ("generated_by", "generated_at", "notes")
        }),
    )
