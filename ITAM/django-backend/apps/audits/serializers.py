# django-backend/apps/audits/serializers.py

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AuditSession, AuditFinding, VarianceReport

User = get_user_model()


class AuditFindingSerializer(serializers.ModelSerializer):
    asset_tag = serializers.CharField(source="asset.tag", read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    auditor_email = serializers.CharField(source="auditor.email", read_only=True)
    auditor_name = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()

    class Meta:
        model = AuditFinding
        fields = (
            "id",
            "audit_session",
            "asset",
            "asset_tag",
            "asset_name",
            "assigned_to",
            "status",
            "notes",
            "auditor",
            "auditor_email",
            "auditor_name",
            "verified_at",
            "current_condition",
            "current_location",
            "evidence_notes",
        )
        read_only_fields = ("id", "verified_at", "auditor")

    def get_auditor_name(self, obj) -> str:
        if not obj.auditor:
            return "System"
        name = f"{obj.auditor.first_name} {obj.auditor.last_name}".strip()
        return name or obj.auditor.email

    def get_assigned_to(self, obj) -> str:
        from apps.audits.services import get_assigned_to_name
        return get_assigned_to_name(obj.asset)


class VarianceReportSerializer(serializers.ModelSerializer):
    generated_by_email = serializers.CharField(source="generated_by.email", read_only=True)

    class Meta:
        model = VarianceReport
        fields = (
            "id",
            "audit_session",
            "total_expected",
            "total_found",
            "total_missing",
            "damaged_count",
            "condition_issues_count",
            "location_mismatches_count",
            "ownership_mismatches_count",
            "accuracy_percentage",
            "generated_by",
            "generated_by_email",
            "generated_at",
            "notes",
        )
        read_only_fields = ("id", "generated_at")


class AuditSessionSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    auditors = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    auditor_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        required=False,
        queryset=User.objects.all(),
    )
    findings_count = serializers.SerializerMethodField()
    variance = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = AuditSession
        fields = (
            "id",
            "title",
            "description",
            "status",
            "created_by",
            "created_by_email",
            "auditors",
            "auditor_ids",
            "planned_date",
            "audit_date",
            "started_at",
            "completed_at",
            "location",
            "location_name",
            "department",
            "category",
            "total_assets_audited",
            "assets_found",
            "assets_not_found",
            "assets_with_issues",
            "findings_count",
            "variance",
            "stats",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "started_at",
            "completed_at",
            "total_assets_audited",
            "assets_found",
            "assets_not_found",
            "assets_with_issues",
            "created_at",
            "updated_at",
        )

    def get_findings_count(self, obj):
        return obj.findings.count()

    def get_variance(self, obj):
        return obj.calculate_variance()

    def get_stats(self, obj):
        from .services import build_audit_results
        results = build_audit_results(obj)
        return {
            "expected": results["expected"],
            "verified": results["verified"],
            "missing": results["missing"],
            "progress_pct": results["progress_pct"],
        }

    def create(self, validated_data):
        auditor_ids = validated_data.pop("auditor_ids", [])
        instance = super().create(validated_data)
        if auditor_ids:
            instance.auditors.set(auditor_ids)
        return instance

    def update(self, instance, validated_data):
        auditor_ids = validated_data.pop("auditor_ids", None)
        instance = super().update(instance, validated_data)
        if auditor_ids is not None:
            instance.auditors.set(auditor_ids)
        return instance
