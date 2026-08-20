from rest_framework import viewsets
from django.utils import timezone

from config.permissions import IsITStaffOrAdmin, IsITStaffOrAdminOrReadOnly

from apps.notifications.services import notify_license_expiry
from .models import LicenseAssignment, SoftwareLicense
from .serializers import LicenseAssignmentSerializer, SoftwareLicenseSerializer


class LicenseViewSet(viewsets.ModelViewSet):
    queryset = SoftwareLicense.objects.select_related("assigned_to").all()
    serializer_class = SoftwareLicenseSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    search_fields = ("software_name", "vendor", "notes")
    ordering_fields = ("software_name", "expiry_date", "created_at")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsITStaffOrAdmin()]
        return super().get_permissions()

    def _notify_expiring_licenses(self, queryset):
        for license_obj in queryset:
            notify_license_expiry(license_obj)

    def list(self, request, *args, **kwargs):
        self._notify_expiring_licenses(self.filter_queryset(self.get_queryset()))
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        license_obj = serializer.save()
        notify_license_expiry(license_obj)

    def perform_update(self, serializer):
        license_obj = serializer.save()
        notify_license_expiry(license_obj)


class LicenseAssignmentViewSet(viewsets.ModelViewSet):
    queryset = LicenseAssignment.objects.select_related(
        "license",
        "assigned_to_user",
        "asset",
    ).all()
    serializer_class = LicenseAssignmentSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    search_fields = (
        "license__software_name",
        "assigned_to_user__email",
        "assigned_to_name",
        "asset__tag",
    )
    ordering_fields = ("assigned_at", "revoked_at")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsITStaffOrAdmin()]
        return super().get_permissions()
