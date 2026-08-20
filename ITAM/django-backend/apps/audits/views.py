# django-backend/apps/audits/views.py

import io

from django.http import FileResponse, HttpResponse
from django.utils import timezone
from openpyxl import Workbook
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.assets.models import Asset
from .models import AuditSession, AuditFinding, VarianceReport
from .serializers import AuditSessionSerializer, AuditFindingSerializer, VarianceReportSerializer
from .services import (
    build_audit_results,
    finalize_missing_findings,
    get_expected_assets,
    record_scan,
    _refresh_session_counts,
)
from config.permissions import IsAuditor


class AuditSessionViewSet(viewsets.ModelViewSet):
    queryset = AuditSession.objects.all().prefetch_related("auditors", "findings")
    serializer_class = AuditSessionSerializer
    permission_classes = [IsAuthenticated, IsAuditor]
    filterset_fields = ["status", "audit_date", "location", "category", "department"]
    search_fields = ["title", "description", "department__name"]
    ordering_fields = ["audit_date", "planned_date", "created_at"]
    ordering = ["-audit_date", "-planned_date"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        """Live audit results with expected/verified/missing breakdown."""
        session = self.get_object()
        return Response(build_audit_results(session))

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        session = self.get_object()
        if session.status != AuditSession.Status.PLANNED:
            return Response(
                {"detail": "Only planned audits can be started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = AuditSession.Status.IN_PROGRESS
        session.started_at = timezone.now()
        session.audit_date = timezone.now().date()
        session.save(update_fields=["status", "started_at", "audit_date", "updated_at"])
        _refresh_session_counts(session)

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def scan(self, request, pk=None):
        """Scan/verify an asset by tag in the current audit session."""
        session = self.get_object()
        asset_tag = (request.data.get("asset_tag") or request.data.get("tag") or "").strip()
        if not asset_tag:
            return Response({"detail": "asset_tag is required"}, status=status.HTTP_400_BAD_REQUEST)

        asset = Asset.objects.filter(tag__iexact=asset_tag).first()
        if not asset:
            return Response({"detail": f"No asset found with tag {asset_tag}"}, status=status.HTTP_404_NOT_FOUND)

        expected_ids = set(get_expected_assets(session).values_list("id", flat=True))
        if asset.id not in expected_ids:
            return Response(
                {"detail": "Asset is outside the scope of this audit session"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = AuditFinding.objects.filter(audit_session=session, asset=asset).first()
        if existing:
            return Response(
                {
                    "detail": "Asset already scanned in this audit",
                    "finding": AuditFindingSerializer(existing).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Allow richer verification payloads from the scanner UI
        status_val = request.data.get("status") or AuditFinding.Status.FOUND
        notes = request.data.get("notes") or "Verified via QR scan"
        current_condition = request.data.get("current_condition") or ""
        current_location_id = request.data.get("current_location") or None
        evidence_notes = request.data.get("evidence_notes") or ""
        verification = {
            "tag_match": bool(request.data.get("tag_match", True)),
            "serial_match": bool(request.data.get("serial_match", True)),
            "assigned_user_correct": bool(request.data.get("assigned_user_correct", True)),
            "location_correct": bool(request.data.get("location_correct", True)),
        }

        finding = AuditFinding.objects.create(
            audit_session=session,
            asset=asset,
            status=status_val,
            notes=notes,
            auditor=request.user,
            current_condition=current_condition,
            current_location_id=current_location_id,
            evidence_notes=evidence_notes,
            verification=verification,
        )

        asset.last_audit_at = timezone.now()
        asset.save(update_fields=["last_audit_at", "updated_at"])
        _refresh_session_counts(session)

        return Response(AuditFindingSerializer(finding).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.status != AuditSession.Status.IN_PROGRESS:
            return Response(
                {"detail": "Only in-progress audits can be completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        finalize_missing_findings(session, request.user)

        findings = session.findings.all()
        session.status = AuditSession.Status.COMPLETED
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at", "updated_at"])
        _refresh_session_counts(session)
        session.refresh_from_db()

        accuracy = (
            (session.assets_found / session.total_assets_audited * 100)
            if session.total_assets_audited > 0
            else 0
        )

        VarianceReport.objects.update_or_create(
            audit_session=session,
            defaults={
                "total_expected": session.total_assets_audited,
                "total_found": session.assets_found,
                "total_missing": session.assets_not_found,
                "damaged_count": findings.filter(status=AuditFinding.Status.DAMAGED).count(),
                "condition_issues_count": findings.filter(status=AuditFinding.Status.CONDITION_ISSUE).count(),
                "location_mismatches_count": findings.filter(status=AuditFinding.Status.LOCATION_MISMATCH).count(),
                "ownership_mismatches_count": findings.filter(status=AuditFinding.Status.OWNERSHIP_MISMATCH).count(),
                "accuracy_percentage": accuracy,
                "generated_by": request.user,
            },
        )

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def variance_report(self, request, pk=None):
        session = self.get_object()
        try:
            report = session.variance_report
            serializer = VarianceReportSerializer(report)
            return Response(serializer.data)
        except VarianceReport.DoesNotExist:
            return Response(
                {"detail": "Variance report not yet generated"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["get"], url_path="export-xlsx")
    def export_xlsx(self, request, pk=None):
        session = self.get_object()
        results = build_audit_results(session)

        wb = Workbook()
        ws = wb.active
        ws.title = "Audit Results"
        ws.append([
            "Asset Tag", "Asset Name", "Status", "Assigned To",
            "Scan Time", "Scanned By",
        ])
        for row in results["assets"]:
            ws.append([
                row["asset_tag"],
                row["asset_name"],
                "Found" if row["audit_status"] == "found" else "Missing",
                row["assigned_to"],
                row["scan_time"] or "",
                row["scanned_by"],
            ])

        ws2 = wb.create_sheet("Missing Assets")
        ws2.append(["Asset Tag", "Asset Name", "Assigned To"])
        for row in results["missing_assets"]:
            ws2.append([row["asset_tag"], row["asset_name"], row["assigned_to"]])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        filename = f"{session.audit_id or f'audit_{session.id}'}_{session.title[:30].replace(' ', '_')}.xlsx"
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=filename,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    @action(detail=True, methods=["get"], url_path="export-pdf")
    def export_pdf(self, request, pk=None):
        """Return a printable HTML report (save as PDF from browser)."""
        session = self.get_object()
        results = build_audit_results(session)
        rows_html = "".join(
            f"<tr><td>{r['asset_tag']}</td><td>{r['asset_name']}</td>"
            f"<td>{'Found' if r['audit_status'] == 'found' else 'Missing'}</td>"
            f"<td>{r['assigned_to']}</td><td>{r['scan_time'] or '—'}</td>"
            f"<td>{r['scanned_by'] or '—'}</td></tr>"
            for r in results["assets"]
        )
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Audit Report - {session.audit_id or session.title}</title>
<style>
body{{font-family:Arial,sans-serif;padding:24px;color:#111}}
h1{{font-size:20px}} table{{width:100%;border-collapse:collapse;margin-top:16px}}
th,td{{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}}
th{{background:#f0f0f0}} .stats{{display:flex;gap:24px;margin:16px 0}}
.stat{{padding:12px 16px;border:1px solid #ddd;border-radius:8px}}
</style></head><body>
<h1>Asset Audit Report</h1>
<p><strong>Audit ID:</strong> {session.audit_id or ''} | <strong>Session:</strong> {session.title} | <strong>Status:</strong> {session.get_status_display()}</p>
<p><strong>Type:</strong> {session.get_audit_type_display() if hasattr(session, 'get_audit_type_display') else session.audit_type} | <strong>Location:</strong> {session.location.name if session.location else 'All'} |
<strong>Department:</strong> {session.department.name if session.department else 'All'} | <strong>Lead:</strong> {session.lead_auditor.email if session.lead_auditor else '—'}</p>
<div class="stats">
<div class="stat"><strong>Expected:</strong> {results['expected']}</div>
<div class="stat"><strong>Verified:</strong> {results['verified']}</div>
<div class="stat"><strong>Missing:</strong> {results['missing']}</div>
<div class="stat"><strong>Progress:</strong> {results['progress_pct']}%</div>
</div>
<table><thead><tr>
<th>Asset Tag</th><th>Asset Name</th><th>Status</th><th>Assigned To</th><th>Scan Time</th><th>Scanned By</th>
</tr></thead><tbody>{rows_html}</tbody></table>
<p style="margin-top:24px;font-size:11px;color:#666">Generated {timezone.now().strftime('%Y-%m-%d %H:%M')}</p>
</body></html>"""
        response = HttpResponse(html, content_type="text/html")
        response["Content-Disposition"] = f'attachment; filename="audit_{session.id}_report.html"'
        return response


class AuditFindingViewSet(viewsets.ModelViewSet):
    queryset = AuditFinding.objects.all().select_related("asset", "auditor", "current_location")
    serializer_class = AuditFindingSerializer
    permission_classes = [IsAuthenticated, IsAuditor]
    filterset_fields = ["audit_session", "asset", "status", "auditor"]
    search_fields = ["asset__tag", "asset__name", "notes"]
    ordering_fields = ["verified_at", "status"]
    ordering = ["-verified_at"]

    def perform_create(self, serializer):
        finding = serializer.save(auditor=self.request.user)
        finding.asset.last_audit_at = timezone.now()
        finding.asset.save(update_fields=["last_audit_at", "updated_at"])
        _refresh_session_counts(finding.audit_session)
