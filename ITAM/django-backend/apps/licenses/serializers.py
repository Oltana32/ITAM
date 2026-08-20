from rest_framework import serializers

from .models import LicenseAssignment, SoftwareLicense


class SoftwareLicenseSerializer(serializers.ModelSerializer):
    assigned_to_email = serializers.EmailField(source="assigned_to.email", read_only=True, required=False)
    vendor_display = serializers.CharField(source="get_vendor_display", read_only=True)
    allocated_seats = serializers.IntegerField(read_only=True)
    used_seats = serializers.IntegerField(read_only=True)
    active_users = serializers.IntegerField(required=False)
    available_seats = serializers.IntegerField(read_only=True)
    annual_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    total_annual_cost = serializers.DecimalField(source="annual_cost", max_digits=12, decimal_places=2, read_only=True)
    cost_per_seat = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    utilization_percentage = serializers.IntegerField(read_only=True)
    status = serializers.CharField(read_only=True)
    cost_currency = serializers.CharField(required=False)

    class Meta:
        model = SoftwareLicense
        fields = (
            "id",
            "software_name",
            "seats",
            "expiry_date",
            "assigned_to",
            "assigned_to_email",
            "vendor",
            "vendor_display",
            "allocated_seats",
            "used_seats",
            "active_users",
            "available_seats",
            "utilization_percentage",
            "status",
            "annual_cost",
            "total_annual_cost",
            "cost_per_seat",
            "cost_currency",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class LicenseAssignmentSerializer(serializers.ModelSerializer):
    software_name = serializers.CharField(source="license.software_name", read_only=True)
    assigned_to_email = serializers.EmailField(source="assigned_to_user.email", read_only=True, required=False)
    asset_tag = serializers.CharField(source="asset.tag", read_only=True, required=False)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = LicenseAssignment
        fields = (
            "id",
            "license",
            "software_name",
            "assigned_to_user",
            "assigned_to_email",
            "asset",
            "asset_tag",
            "assigned_to_name",
            "assigned_at",
            "revoked_at",
            "is_active",
            "notes",
        )
        read_only_fields = ("id", "assigned_at", "is_active")

    def validate_assigned_to_name(self, value: str) -> str:
        return value.strip()

