from rest_framework import serializers

from .models import SavedReport


class SavedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedReport
        fields = (
            "id",
            "user",
            "name",
            "report_type",
            "parameters",
            "is_shared",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "created_at", "updated_at")
