from datetime import datetime

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.assets.history import log_status_change
from apps.core.constants import AssetStatus
from apps.maintenance.models import MaintenanceRecord, MaintenanceStatus, MaintenanceType
from apps.notifications.services import notify_asset_assigned, notify_asset_returned
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
        assignment = serializer.save(assigner=self.request.user)
        notify_asset_assigned(assignment)

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

        inspection = request.data.get("inspection") or {}
        inspection_date = inspection.get("inspectionDate")
        if inspection_date:
            try:
                datetime.fromisoformat(str(inspection_date))
            except ValueError:
                return Response({"detail": "inspectionDate must be a valid date"}, status=status.HTTP_400_BAD_REQUEST)

        final_status = inspection.get("finalAssetStatus") or AssetStatus.AVAILABLE
        if isinstance(final_status, str):
            final_status = final_status.strip().lower()
            if final_status == "under maintenance":
                final_status = AssetStatus.MAINTENANCE
            elif final_status == "available":
                final_status = AssetStatus.AVAILABLE
            elif final_status == "retired":
                final_status = AssetStatus.RETIRED
            elif final_status == "disposed":
                final_status = AssetStatus.DISPOSED
            elif final_status == "maintenance":
                final_status = AssetStatus.MAINTENANCE

        assignment.return_asset(condition=inspection.get("overallCondition") or None, returned_by=request.user)

        assignment.asset.location = assignment.asset.location
        if final_status == AssetStatus.AVAILABLE:
            assignment.asset.location = assignment.asset.location
            assignment.asset.change_status(
                AssetStatus.AVAILABLE,
                changed_by=request.user,
                reason=f"Returned via QR scan by {request.user.email}",
            )
        elif final_status == AssetStatus.MAINTENANCE:
            assignment.asset.change_status(
                AssetStatus.MAINTENANCE,
                changed_by=request.user,
                reason=f"Inspection required maintenance for {assignment.asset.tag}",
            )
            MaintenanceRecord.objects.create(
                asset=assignment.asset,
                type=MaintenanceType.INSPECTION,
                schedule_date=timezone.now().date(),
                status=MaintenanceStatus.IN_PROGRESS,
                technician=request.user,
                description=(inspection.get("maintenanceIssue") or inspection.get("inspectionRemarks") or "Inspection requested after return"),
            )
        else:
            assignment.asset.change_status(
                final_status,
                changed_by=request.user,
                reason=f"Returned with final status {final_status}",
            )

        if inspection:
            inspection_payload = {
                "inspection_date": inspection_date,
                "inspected_by": inspection.get("inspectedBy") or "",
                "overall_condition": inspection.get("overallCondition") or "",
                "physical_condition": ", ".join(inspection.get("physicalCondition") or []),
                "functional_test": inspection.get("functionalTest") or "",
                "accessories_returned": ", ".join(inspection.get("accessoriesReturned") or []),
                "missing_accessories": inspection.get("missingAccessories") or "",
                "requires_maintenance": bool(inspection.get("requiresMaintenance")),
                "maintenance_issue": inspection.get("maintenanceIssue") or "",
                "data_wiped": inspection.get("dataWiped") or "",
                "final_asset_status": final_status,
                "inspection_remarks": inspection.get("inspectionRemarks") or "",
                "employee_signature": inspection.get("employeeSignature") or "",
                "it_staff_signature": inspection.get("itStaffSignature") or "",
                "returned_by": inspection.get("returnedBy") or "",
                "received_by": inspection.get("receivedBy") or "",
            }
            assignment.asset.notes = (
                assignment.asset.notes + "\n\nReturn Inspection: " + str(inspection_payload)
            ).strip()
            assignment.asset.save(update_fields=["notes", "updated_at"])
            log_status_change(
                assignment.asset,
                assignment.asset.status,
                assignment.asset.status,
                changed_by=request.user,
                reason=f"Inspection completed: {inspection_payload['final_asset_status']}",
            )

        notify_asset_returned(assignment)
        assignment.refresh_from_db()
        return Response(AssignmentSerializer(assignment).data)

    @action(detail=False, methods=["post"], permission_classes=[IsITStaffOrAdmin], url_path="bulk-assign")
    def bulk_assign(self, request):
        """POST /api/assignments/bulk-assign/ — assign multiple assets to one assignee.

        Payload example:
        { "asset_ids": [1,2,3], "assigned_to_name": "Jane Doe", "employee_id": "E-1023", "department": "Finance", "email": "jane@company.com", "location": "HQ - 3rd Floor", "expected_return_date": "2026-12-01" }
        """
        data = request.data
        asset_ids = data.get("asset_ids") or []
        if not asset_ids:
            return Response({"detail": "asset_ids is required"}, status=status.HTTP_400_BAD_REQUEST)

        assignee = {
            "assigned_to_name": data.get("assigned_to_name"),
            "employee_id": data.get("employee_id"),
            "department": data.get("department"),
            "email": data.get("email"),
            "location": data.get("location"),
            "expected_return_date": data.get("expected_return_date"),
        }

        created = []
        errors = []

        from apps.assets.models import Asset

        for aid in asset_ids:
            try:
                asset = Asset.objects.get(pk=aid)
            except Exception:
                errors.append({"asset_id": aid, "errors": {"asset": "Not found"}})
                continue

            # Check assignable
            if not asset.is_available_for_assignment:
                errors.append({"asset_id": aid, "errors": {"asset": "Not available for assignment"}})
                continue

            # AssignmentSerializer expects camelCase input keys matching API contract
            payload = {
                "asset": asset.id,
                "assignedTo": assignee.get("assigned_to_name"),
                "employeeId": assignee.get("employee_id"),
                "department": assignee.get("department"),
                "email": assignee.get("email"),
                "location": assignee.get("location"),
                "expectedReturnDate": assignee.get("expected_return_date"),
            }
            serializer = AssignmentSerializer(data=payload)
            if not serializer.is_valid():
                errors.append({"asset_id": aid, "errors": serializer.errors})
                continue

            # Save via serializer so hooks are used
            assignment = serializer.save(assigner=request.user)
            # Update asset status
            assignment.asset.change_status(
                AssetStatus.ASSIGNED, changed_by=request.user, reason=f"Bulk assigned to {assignee.get('assigned_to_name')}"
            )
            notify_asset_assigned(assignment)
            created.append({"asset_id": aid, "assignment_id": assignment.id})

        summary = {"requested": len(asset_ids), "created": len(created), "failed": len(errors)}
        return Response({"created": created, "errors": errors, "summary": summary})
