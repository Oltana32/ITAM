"""Audit session business logic."""

from __future__ import annotations

from django.db.models import Q, QuerySet
from django.utils import timezone

from apps.assets.models import Asset
from apps.core.constants import AssetStatus

from .models import AuditFinding, AuditSession


def get_expected_assets(session: AuditSession) -> QuerySet[Asset]:
    """Assets in scope for an audit session."""
    qs = Asset.objects.select_related("location", "manufacturer").exclude(
        status__in=[AssetStatus.RETIRED, AssetStatus.DISPOSED]
    )
    if session.location_id:
        qs = qs.filter(location_id=session.location_id)
    if getattr(session, "department_id", None):
        # session.department is a FK to core.Department; compare by name
        dept_name = session.department.name if session.department else None
        if dept_name:
            qs = qs.filter(department__iexact=dept_name.strip())
    if session.category:
        qs = qs.filter(category=session.category)
    return qs.order_by("tag")


def get_assigned_to_name(asset: Asset) -> str:
    active = asset.assignments.filter(
        status__in=[AssetStatus.ASSIGNED, AssetStatus.IN_USE]
    ).order_by("-assigned_date").first()
    return active.assigned_to_name if active else ""


def build_audit_results(session: AuditSession) -> dict:
    """Build live audit statistics and asset rows."""
    expected_qs = get_expected_assets(session)
    expected_ids = set(expected_qs.values_list("id", flat=True))
    findings = {
        f.asset_id: f
        for f in session.findings.select_related("asset", "auditor").all()
    }

    verified_ids = {
        aid for aid, f in findings.items()
        if f.status == AuditFinding.Status.FOUND and aid in expected_ids
    }
    missing_ids = expected_ids - verified_ids

    rows = []
    for asset in expected_qs:
        finding = findings.get(asset.id)
        is_found = asset.id in verified_ids
        auditor_name = ""
        if finding and finding.auditor:
            auditor_name = (
                f"{finding.auditor.first_name} {finding.auditor.last_name}".strip()
                or finding.auditor.email
            )
        rows.append({
            "asset_id": asset.id,
            "asset_tag": asset.tag,
            "asset_name": asset.name,
            "audit_status": "found" if is_found else "missing",
            "assigned_to": get_assigned_to_name(asset),
            "scan_time": finding.verified_at.isoformat() if finding and is_found else None,
            "scanned_by": auditor_name,
            "scanned_by_email": finding.auditor.email if finding and finding.auditor else "",
            "finding_id": finding.id if finding else None,
        })

    expected_count = len(expected_ids)
    verified_count = len(verified_ids)
    missing_count = len(missing_ids)
    progress = round((verified_count / expected_count) * 100, 1) if expected_count else 0

    missing_assets = [r for r in rows if r["audit_status"] == "missing"]

    return {
        "expected": expected_count,
        "verified": verified_count,
        "missing": missing_count,
        "progress_pct": progress,
        "assets": rows,
        "missing_assets": missing_assets,
    }


def record_scan(session: AuditSession, asset: Asset, user) -> AuditFinding:
    """Record a verified asset scan; raises ValueError if duplicate."""
    if session.status != AuditSession.Status.IN_PROGRESS:
        raise ValueError("Audit session is not in progress")

    existing = AuditFinding.objects.filter(audit_session=session, asset=asset).first()
    if existing:
        raise ValueError("duplicate")

    finding = AuditFinding.objects.create(
        audit_session=session,
        asset=asset,
        status=AuditFinding.Status.FOUND,
        auditor=user,
        notes="Verified via QR scan",
    )
    asset.last_audit_at = timezone.now()
    asset.save(update_fields=["last_audit_at", "updated_at"])
    _refresh_session_counts(session)
    return finding


def finalize_missing_findings(session: AuditSession, user) -> None:
    """Create not_found findings for assets not scanned during the audit."""
    results = build_audit_results(session)
    for row in results["missing_assets"]:
        AuditFinding.objects.get_or_create(
            audit_session=session,
            asset_id=row["asset_id"],
            defaults={
                "status": AuditFinding.Status.NOT_FOUND,
                "auditor": user,
                "notes": "Not scanned during audit session",
            },
        )
    _refresh_session_counts(session)


def _refresh_session_counts(session: AuditSession) -> None:
    findings = session.findings.all()
    session.total_assets_audited = get_expected_assets(session).count()
    session.assets_found = findings.filter(status=AuditFinding.Status.FOUND).count()
    session.assets_not_found = findings.filter(status=AuditFinding.Status.NOT_FOUND).count()
    session.assets_with_issues = findings.exclude(
        status__in=[AuditFinding.Status.FOUND, AuditFinding.Status.NOT_FOUND]
    ).count()
    session.save(update_fields=[
        "total_assets_audited",
        "assets_found",
        "assets_not_found",
        "assets_with_issues",
        "updated_at",
    ])
