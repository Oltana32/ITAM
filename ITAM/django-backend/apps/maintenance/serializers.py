from rest_framework import serializers

from .models import MaintenanceRecord, MaintenanceStatus


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    asset_tag = serializers.CharField(source="asset.tag", read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    asset_location = serializers.CharField(source="asset.location.name", read_only=True)
    asset_assigned_to = serializers.SerializerMethodField(read_only=True)
    asset_employee_id = serializers.SerializerMethodField(read_only=True)
    technician_email = serializers.CharField(source="technician.email", read_only=True, required=False)

    class Meta:
        model = MaintenanceRecord
        fields = (
            "id",
            "asset",
            "asset_tag",
            "asset_name",
            "asset_location",
            "asset_assigned_to",
            "asset_employee_id",
            "type",
            "schedule_date",
            "completed_date",
            "status",
            "technician",
            "technician_email",
            "description",
            "cost",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        asset = attrs.get("asset") or getattr(self.instance, "asset", None)
        status = attrs.get("status") or getattr(self.instance, "status", None)
        completed = attrs.get("completed_date")
        schedule = attrs.get("schedule_date") or getattr(
            self.instance,
            "schedule_date",
            None,
        )
        if completed and schedule and completed < schedule:
            raise serializers.ValidationError(
                {"completed_date": "Completed date cannot be before schedule date."},
            )
        if asset and status == MaintenanceStatus.IN_PROGRESS and asset.is_in_active_use:
            raise serializers.ValidationError(
                {"asset": "Assigned or in-use assets must be returned before maintenance starts."}
            )
        return attrs

    def get_asset_assigned_to(self, instance):
        assignment = instance.asset.current_assignment
        return assignment.assigned_to_name if assignment else None

    def get_asset_employee_id(self, instance):
        assignment = instance.asset.current_assignment
        return assignment.employee_id if assignment else None
