from rest_framework import serializers

from apps.assets.history import FIELD_LABELS
from apps.users.models import UserRole

from .models import Asset, AssetStatusHistory


class AssetStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    changed_by_email = serializers.SerializerMethodField()
    changed_by_role = serializers.SerializerMethodField()
    field_label = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    class Meta:
        model = AssetStatusHistory
        fields = (
            "id",
            "asset",
            "asset_tag",
            "change_type",
            "field_name",
            "field_label",
            "old_value",
            "new_value",
            "from_status",
            "to_status",
            "summary",
            "changed_by",
            "changed_by_name",
            "changed_by_email",
            "changed_by_role",
            "changed_at",
            "reason",
        )
        read_only_fields = fields

    def get_changed_by_name(self, obj) -> str:
        if not obj.changed_by:
            return "System"
        name = f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip()
        return name or obj.changed_by.email

    def get_changed_by_email(self, obj) -> str:
        return obj.changed_by.email if obj.changed_by else ""

    def get_changed_by_role(self, obj) -> str:
        if not obj.changed_by:
            return ""
        role = getattr(obj.changed_by, "role", "")
        return dict(UserRole.choices).get(role, role)

    def get_field_label(self, obj) -> str:
        return FIELD_LABELS.get(obj.field_name, obj.field_name.replace("_", " ").title())

    def get_summary(self, obj) -> str:
        if obj.change_type == "create":
            return f"Asset created: {obj.new_value}"
        if obj.change_type == "status" or obj.field_name == "status":
            return f"Status changed from {obj.old_value or obj.from_status} to {obj.new_value or obj.to_status}"
        if obj.field_name:
            label = self.get_field_label(obj)
            return f"{label} changed from \"{obj.old_value}\" to \"{obj.new_value}\""
        return obj.reason or "Asset updated"


class AssetSerializer(serializers.ModelSerializer):
    tag = serializers.CharField(required=False, allow_blank=True, read_only=True)
    manufacturer_name = serializers.CharField(source="manufacturer.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    assignedTo = serializers.SerializerMethodField(read_only=True)
    depreciation = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Asset
        fields = (
            "id",
            "name",
            "tag",
            "serial_number",
            "status",
            "category",
            "manufacturer",
            "manufacturer_name",
            "location",
            "location_name",
            "assignedTo",
            "model",
            "condition",
            "department",
            "purchase_date",
            "purchase_cost",
            "warranty_expiry",
            "useful_life_years",
            "residual_value",
            "depreciation_method",
            "specs",
            "depreciation",
            "notes",
            "last_audit_at",
            "created_by",
            "created_at",
            "updated_at",
            "updated_by",
        )
        read_only_fields = ("id", "tag", "created_by", "created_at", "updated_at", "updated_by", "depreciation")

    def get_assignedTo(self, instance):
        from apps.core.constants import AssetStatus

        active = instance.assignments.filter(
            status__in=[AssetStatus.ASSIGNED, AssetStatus.IN_USE]
        ).order_by("-assigned_date", "-id").first()
        if active and active.assigned_to_name:
            return active.assigned_to_name
        return None

    def get_depreciation(self, instance):
        return instance.calculate_depreciation()

    def validate_serial_number(self, value: str) -> str:
        v = value.strip()
        if not v:
            raise serializers.ValidationError("Serial number is required.")
        return v
