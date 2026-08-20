# django-backend/apps/audits/serializers.py

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AuditSession, AuditFinding, VarianceReport
from django.apps import apps as django_apps

User = get_user_model()


class AuditFindingSerializer(serializers.ModelSerializer):
    asset_tag = serializers.CharField(source="asset.tag", read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    auditor_email = serializers.CharField(source="auditor.email", read_only=True)
    auditor_name = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()
    verification = serializers.JSONField(required=False)

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
            "result",
            "auditor",
            "auditor_email",
            "auditor_name",
            "verified_at",
            "current_condition",
            "current_location",
            "verification",
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

    def get_result(self, obj) -> str:
        return getattr(obj, "result_status", "Not Audited")


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
    audit_id = serializers.CharField(read_only=True)
    audit_type = serializers.ChoiceField(choices=AuditSession.AuditType.choices, required=False)
    lead_auditor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    department = serializers.SerializerMethodField(read_only=True)
    department_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    findings_count = serializers.SerializerMethodField()
    variance = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = AuditSession
        fields = (
            "audit_id",
            "id",
            "title",
            "description",
            "audit_type",
            "status",
            "created_by",
            "created_by_email",
            "auditors",
            "auditor_ids",
            "lead_auditor",
            "planned_date",
            "audit_date",
            "started_at",
            "completed_at",
            "location",
            "location_name",
            "department",
            "department_id",
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            Department = django_apps.get_model("core", "Department")
            if Department:
                self.fields["department"].queryset = Department.objects.all()
        except Exception:
            # If Department model is not present in INSTALLED_APPS, leave queryset None
            pass

    def create(self, validated_data):
        auditor_ids = validated_data.pop("auditor_ids", [])
        dept_id = validated_data.pop("department_id", None)
        instance = super().create(validated_data)
        if dept_id is not None:
            try:
                from django.apps import apps as django_apps
                Department = django_apps.get_model("core", "Department")
                instance.department = Department.objects.filter(pk=dept_id).first()
                instance.save(update_fields=["department"])
            except Exception:
                pass
        if auditor_ids:
            instance.auditors.set(auditor_ids)
        return instance

    def update(self, instance, validated_data):
        auditor_ids = validated_data.pop("auditor_ids", None)
        dept_id = validated_data.pop("department_id", None)
        instance = super().update(instance, validated_data)
        if auditor_ids is not None:
            instance.auditors.set(auditor_ids)
        if dept_id is not None:
            try:
                from django.apps import apps as django_apps
                Department = django_apps.get_model("core", "Department")
                instance.department = Department.objects.filter(pk=dept_id).first()
                instance.save(update_fields=["department"])
            except Exception:
                pass
        return instance

    def get_department(self, obj):
        if not obj.department:
            return None
        return {"id": obj.department.id, "name": str(obj.department)}
