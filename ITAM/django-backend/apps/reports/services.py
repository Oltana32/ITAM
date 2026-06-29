"""Report generation services for CSV exports."""

import csv
import io

from django.utils import timezone

from apps.assets.models import Asset, AssetStatusHistory
from apps.assignments.models import Assignment
from apps.maintenance.models import MaintenanceRecord
from apps.licenses.models import SoftwareLicense


def _write_csv(headers: list[str], rows: list[list]) -> io.BytesIO:
    """Write CSV data to a BytesIO buffer."""
    text_buffer = io.StringIO()
    writer = csv.writer(text_buffer)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    output = io.BytesIO(text_buffer.getvalue().encode("utf-8-sig"))
    output.seek(0)
    return output


def generate_asset_report() -> io.BytesIO:
    """Generate Asset Report: Asset Tag, Asset Name, Category, Status, Location."""
    headers = ["Asset Tag", "Asset Name", "Category", "Status", "Location"]
    assets = Asset.objects.select_related("location").all().order_by("tag")
    rows = [
        [
            asset.tag,
            asset.name,
            asset.get_category_display(),
            asset.get_status_display(),
            asset.location.name,
        ]
        for asset in assets
    ]
    return _write_csv(headers, rows)


def generate_assignment_report() -> io.BytesIO:
    """Generate Assignment Report: Asset, Assignee, Assignment Date, Return Date."""
    headers = [
        "Asset Tag",
        "Asset Name",
        "Assigned To",
        "Employee ID",
        "Assignment Date",
        "Return Date",
        "Status",
    ]
    assignments = Assignment.objects.select_related("asset").all().order_by("-assigned_date")
    rows = [
        [
            assignment.asset.tag,
            assignment.asset.name,
            assignment.assigned_to_name,
            assignment.employee_id,
            assignment.assigned_date,
            assignment.actual_return_date,
            assignment.get_status_display(),
        ]
        for assignment in assignments
    ]
    return _write_csv(headers, rows)


def generate_maintenance_report() -> io.BytesIO:
    """Generate Maintenance Report: Asset, Work Order ID, Maintenance Status, Cost."""
    headers = [
        "Asset Tag",
        "Asset Name",
        "Work Order ID",
        "Type",
        "Status",
        "Scheduled Date",
        "Cost",
    ]
    maintenance = MaintenanceRecord.objects.select_related("asset").all().order_by("-schedule_date")
    rows = [
        [
            record.asset.tag,
            record.asset.name,
            f"MNT-{record.id:06d}",
            record.get_type_display(),
            record.get_status_display(),
            record.schedule_date,
            record.cost,
        ]
        for record in maintenance
    ]
    return _write_csv(headers, rows)


def generate_license_report() -> io.BytesIO:
    """Generate License Report: Software, Vendor, Expiry Date, Seats."""
    headers = [
        "Software Name",
        "Vendor",
        "Seats",
        "Allocated Seats",
        "Available Seats",
        "Expiry Date",
        "Status",
    ]
    licenses = SoftwareLicense.objects.all().order_by("software_name")
    today = timezone.now().date()

    rows = []
    for license in licenses:
        if license.expiry_date:
            if license.expiry_date < today:
                status = "Expired"
            elif (license.expiry_date - today).days <= 30:
                status = "Expiring Soon"
            else:
                status = "Active"
        else:
            status = "No Expiry Date"

        rows.append([
            license.software_name,
            license.get_vendor_display(),
            license.seats,
            license.allocated_seats,
            license.available_seats,
            license.expiry_date,
            status,
        ])

    return _write_csv(headers, rows)


def generate_status_history_report() -> io.BytesIO:
    """Generate Asset Change History Report."""
    from apps.users.models import UserRole

    headers = [
        "Asset Tag",
        "Asset Name",
        "Change Type",
        "Field",
        "Old Value",
        "New Value",
        "Changed By",
        "Role",
        "Changed At",
        "Reason",
    ]
    history = (
        AssetStatusHistory.objects
        .select_related("asset", "changed_by")
        .order_by("-changed_at")
    )

    rows = []
    for entry in history:
        user = entry.changed_by
        if user:
            name = f"{user.first_name} {user.last_name}".strip() or user.email
            role = dict(UserRole.choices).get(getattr(user, "role", ""), "")
        else:
            name = "System"
            role = ""

        field_label = entry.field_name.replace("_", " ").title() if entry.field_name else ""

        rows.append([
            entry.asset.tag,
            entry.asset.name,
            entry.get_change_type_display(),
            field_label,
            entry.old_value,
            entry.new_value,
            name,
            role,
            entry.changed_at.strftime("%Y-%m-%d %H:%M:%S"),
            entry.reason,
        ])

    return _write_csv(headers, rows)
