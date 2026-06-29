from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse

from apps.users.models import UserRole
from config.permissions import CanAccessReports, IsITTeamOrAdmin

from .models import SavedReport
from .serializers import SavedReportSerializer
from .services import (
    generate_asset_report,
    generate_assignment_report,
    generate_maintenance_report,
    generate_license_report,
    generate_status_history_report,
)


class SavedReportViewSet(viewsets.ModelViewSet):
    serializer_class = SavedReportSerializer
    permission_classes = [CanAccessReports]
    search_fields = ("name",)
    ordering_fields = ("name", "updated_at", "created_at")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsITTeamOrAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return SavedReport.objects.none()
        qs = SavedReport.objects.all()
        if getattr(user, "role", None) in (UserRole.ADMIN, UserRole.IT_TEAM):
            return qs.filter(Q(user=user) | Q(is_shared=True))
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def generate_asset_report(self, request):
        """Generate Asset Report as CSV."""
        try:
            csv_file = generate_asset_report()
            return FileResponse(
                csv_file,
                as_attachment=True,
                filename="asset_report.csv",
                content_type="text/csv",
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def generate_assignment_report(self, request):
        """Generate Assignment Report as CSV."""
        try:
            csv_file = generate_assignment_report()
            return FileResponse(
                csv_file,
                as_attachment=True,
                filename="assignment_report.csv",
                content_type="text/csv",
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def generate_maintenance_report(self, request):
        """Generate Maintenance Report as CSV."""
        try:
            csv_file = generate_maintenance_report()
            return FileResponse(
                csv_file,
                as_attachment=True,
                filename="maintenance_report.csv",
                content_type="text/csv",
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def generate_license_report(self, request):
        """Generate License Report as CSV."""
        try:
            csv_file = generate_license_report()
            return FileResponse(
                csv_file,
                as_attachment=True,
                filename="license_report.csv",
                content_type="text/csv",
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def generate_status_history_report(self, request):
        """Generate Asset Change History Report as CSV."""
        try:
            csv_file = generate_status_history_report()
            return FileResponse(
                csv_file,
                as_attachment=True,
                filename="status_history_report.csv",
                content_type="text/csv",
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
