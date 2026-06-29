from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from apps.assets.models import Asset

from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    asset_tag = serializers.CharField(source="asset.tag", read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    assignedBy = serializers.CharField(source="assigner.email", read_only=True)

    assignedTo = serializers.CharField(source="assigned_to_name")
    employeeId = serializers.CharField(source="employee_id")
    department = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField()
    expectedReturnDate = serializers.DateField(source="expected_return_date", required=False, allow_null=True)
    actualReturnDate = serializers.DateField(source="actual_return_date", required=False, allow_null=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "asset",
            "asset_tag",
            "asset_name",
            "assignedBy",
            "assignedTo",
            "employeeId",
            "department",
            "email",
            "phone",
            "location",
            "assigned_date",
            "expectedReturnDate",
            "actualReturnDate",
            "status",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "assignedBy", "created_at", "updated_at")

    def validate(self, attrs):
        asset: Asset | None = attrs.get("asset") or getattr(self.instance, "asset", None)
        status_val = attrs.get("status", getattr(self.instance, "status", None))
        assigned_to_name = attrs.get("assigned_to_name") or getattr(self.instance, "assigned_to_name", None)
        employee_id = attrs.get("employee_id") or getattr(self.instance, "employee_id", None)
        location = attrs.get("location") or getattr(self.instance, "location", None)
        actual_return_date = attrs.get("actual_return_date", getattr(self.instance, "actual_return_date", None))

        if not assigned_to_name:
            raise serializers.ValidationError({"assignedTo": "Assignee full name is required."})
        if not employee_id:
            raise serializers.ValidationError({"employeeId": "Employee ID is required."})
        if not location:
            raise serializers.ValidationError({"location": "Assignment location is required."})

        # Exclude IT Stock from assignment locations
        if location and location.lower() == "it stock":
            raise serializers.ValidationError(
                {"location": "IT Stock is not a valid assignment destination."}
            )

        if actual_return_date and asset:
            assigned_date = attrs.get("assigned_date") or getattr(
                self.instance,
                "assigned_date",
                None,
            )
            if assigned_date:
                assigned_day = assigned_date.date() if hasattr(assigned_date, "date") else assigned_date
                if actual_return_date < assigned_day:
                    raise serializers.ValidationError(
                        {"actual_return_date": "Return date cannot be before assigned date."},
                    )
        return attrs

    def validate_assigned_date(self, value):
        if value and value > timezone.now():
            raise serializers.ValidationError("Assigned date cannot be in the future.")
        return value
