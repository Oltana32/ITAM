import csv
import io

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from config.permissions import IsITStaffOrAdmin, IsITStaffOrAdminOrReadOnly

from .models import MaintenanceRecord
from .serializers import MaintenanceRecordSerializer


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.select_related("asset", "technician").all()
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    search_fields = ("asset__tag", "description")
    ordering_fields = ("schedule_date", "status", "created_at")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsITStaffOrAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        records = self.filter_queryset(self.get_queryset())
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow([
            "Work Order ID",
            "Asset Tag",
            "Asset Name",
            "Type",
            "Status",
            "Scheduled Date",
            "Completed Date",
            "Technician",
            "Description",
            "Cost",
        ])
        for record in records:
            writer.writerow([
                record.id,
                record.asset.tag,
                record.asset.name,
                record.get_type_display(),
                record.get_status_display(),
                record.schedule_date,
                record.completed_date or "",
                record.technician.email if record.technician else "",
                record.description,
                record.cost or "",
            ])
        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=maintenance_export.csv"
        return response
