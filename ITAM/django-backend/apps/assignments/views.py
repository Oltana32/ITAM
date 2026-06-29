from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.constants import AssetStatus
from config.permissions import IsITStaffOrAdmin, IsITStaffOrAdminOrReadOnly

from .models import Assignment
from .serializers import AssignmentSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related("asset", "assigner").all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsITStaffOrAdminOrReadOnly]
    search_fields = ("asset__tag", "asset__name", "assigner__email", "notes")
    ordering_fields = ("assigned_date", "return_date", "status", "created_at")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "return_by_tag"):
            return [IsITStaffOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(assigner=self.request.user)

    @action(detail=False, methods=["post"], url_path="return-by-tag")
    def return_by_tag(self, request):
        """Return an actively assigned asset by scanning its QR tag."""
        asset_tag = (request.data.get("asset_tag") or request.data.get("tag") or "").strip()
        if not asset_tag:
            return Response({"detail": "asset_tag is required"}, status=status.HTTP_400_BAD_REQUEST)

        assignment = (
            Assignment.objects.select_related("asset")
            .filter(
                asset__tag__iexact=asset_tag,
                status__in=[AssetStatus.ASSIGNED, AssetStatus.IN_USE],
            )
            .order_by("-assigned_date")
            .first()
        )
        if not assignment:
            return Response(
                {"detail": f"No active assignment found for tag {asset_tag}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignment.return_asset(returned_by=request.user)
        assignment.asset.change_status(
            AssetStatus.AVAILABLE,
            changed_by=request.user,
            reason=f"Returned via QR scan by {request.user.email}",
        )
        assignment.refresh_from_db()
        return Response(AssignmentSerializer(assignment).data)
