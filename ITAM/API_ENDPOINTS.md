# ITAM System - New API Endpoints Documentation

## Authentication
All endpoints require JWT authentication token.

```
Header: Authorization: Bearer <access_token>
```

---

## File Attachments API

### Overview
Manage file attachments for assets with versioning, access logging, and secure downloads.

### Endpoints

#### List Attachments
```
GET /api/attachments/
```

**Query Parameters:**
- `asset` - Filter by asset ID
- `file_type` - Filter by attachment type (invoice, purchase_order, warranty_document, etc.)
- `is_current` - Filter current/historical versions (true/false)
- `search` - Search in file_name and title
- `ordering` - Sort by (uploaded_at, file_type, etc.)

**Response:**
```json
{
  "count": 10,
  "next": "http://api/attachments/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "asset": 5,
      "file": "/media/assets/attachments/2026/06/24/document.pdf",
      "file_name": "document.pdf",
      "file_type": "invoice",
      "file_size": 245000,
      "mime_type": "application/pdf",
      "title": "Invoice #2026-001",
      "description": "Invoice for asset procurement",
      "uploaded_by": 3,
      "uploaded_by_email": "manager@example.com",
      "uploaded_at": "2026-06-24T10:30:00Z",
      "version": 1,
      "is_current": true,
      "file_url": "/media/assets/attachments/2026/06/24/document.pdf"
    }
  ]
}
```

#### Create Attachment
```
POST /api/attachments/
```

**Required Fields:**
- `asset` - Asset ID (integer)
- `file` - File to upload (multipart/form-data)
- `title` - Document title

**Optional Fields:**
- `file_type` - invoice, purchase_order, warranty_document, maintenance_report, vendor_contract, receipt, warranty_certificate, specification, other
- `description` - Document description

**Request Example:**
```bash
curl -X POST http://api/attachments/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "asset=5" \
  -F "file=@invoice.pdf" \
  -F "title=Invoice #2026-001" \
  -F "file_type=invoice" \
  -F "description=Initial invoice for laptop purchase"
```

**Response:**
```json
{
  "id": 1,
  "asset": 5,
  "file": "/media/assets/attachments/2026/06/24/invoice_xyz.pdf",
  "file_name": "invoice.pdf",
  "file_type": "invoice",
  "file_size": 245000,
  "mime_type": "application/pdf",
  "title": "Invoice #2026-001",
  "description": "Initial invoice for laptop purchase",
  "uploaded_by": 3,
  "uploaded_by_email": "manager@example.com",
  "uploaded_at": "2026-06-24T10:30:00Z",
  "version": 1,
  "is_current": true,
  "file_url": "/media/assets/attachments/2026/06/24/invoice_xyz.pdf"
}
```

#### Download Attachment
```
GET /api/attachments/{id}/download/
```

**Response:**
- HTTP 200 with file content (binary)
- Sets `Content-Disposition: attachment; filename="..."`

**Note:** Download is logged for audit trail

#### Get Attachment Access History
```
GET /api/attachments/{id}/access_history/
```

**Response:**
```json
[
  {
    "id": 1,
    "attachment": 1,
    "user": 3,
    "user_email": "manager@example.com",
    "file_name": "invoice.pdf",
    "action": "download",
    "accessed_at": "2026-06-24T11:00:00Z"
  },
  {
    "id": 2,
    "attachment": 1,
    "user": 5,
    "user_email": "auditor@example.com",
    "file_name": "invoice.pdf",
    "action": "view",
    "accessed_at": "2026-06-24T11:15:00Z"
  }
]
```

#### Replace Attachment (Create New Version)
```
POST /api/attachments/{id}/replace/
```

**Request:**
```bash
curl -X POST http://api/attachments/1/replace/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invoice_v2.pdf" \
  -F "description=Updated invoice with corrected tax"
```

**Response:**
```json
{
  "id": 2,
  "asset": 5,
  "file": "/media/assets/attachments/2026/06/24/invoice_v2_xyz.pdf",
  "file_name": "invoice_v2.pdf",
  "file_type": "invoice",
  "version": 2,
  "is_current": true,
  "replaces": 1,
  "uploaded_at": "2026-06-24T11:30:00Z"
}
```

#### Update Attachment
```
PUT /api/attachments/{id}/
PATCH /api/attachments/{id}/
```

**Updateable Fields:**
- `title`
- `description`
- `file_type`

#### Delete Attachment
```
DELETE /api/attachments/{id}/
```

**Response:** HTTP 204 No Content

---

## Asset Audit API

### Overview
Manage physical asset audits with session tracking, finding recording, and variance reporting.

### Endpoints

#### List Audit Sessions
```
GET /api/audit-sessions/
```

**Query Parameters:**
- `status` - planned, in_progress, completed, cancelled
- `audit_date` - Filter by audit date
- `location` - Filter by location ID
- `category` - Filter by asset category
- `search` - Search in title and description

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "title": "Q2 2026 Physical Audit",
      "description": "Complete inventory audit for Q2",
      "status": "completed",
      "created_by": 3,
      "created_by_email": "manager@example.com",
      "auditors": [3, 5, 6],
      "planned_date": "2026-06-15",
      "audit_date": "2026-06-20",
      "started_at": "2026-06-20T09:00:00Z",
      "completed_at": "2026-06-20T17:30:00Z",
      "location": 2,
      "category": "laptop",
      "total_assets_audited": 45,
      "assets_found": 44,
      "assets_not_found": 1,
      "assets_with_issues": 3,
      "findings_count": 45,
      "variance": {
        "total_audited": 45,
        "found": 44,
        "not_found": 1,
        "variance_percentage": 2.22,
        "issues": 3
      },
      "created_at": "2026-06-15T09:00:00Z",
      "updated_at": "2026-06-20T17:30:00Z"
    }
  ]
}
```

#### Create Audit Session
```
POST /api/audit-sessions/
```

**Required Fields:**
- `title` - Session title
- `planned_date` - Date (YYYY-MM-DD format)
- `auditor_ids` - Array of auditor user IDs

**Optional Fields:**
- `description` - Session description
- `location` - Location ID (null for all)
- `category` - Asset category (null for all)

**Request:**
```json
{
  "title": "Q3 2026 Physical Audit",
  "description": "Complete inventory audit",
  "planned_date": "2026-09-15",
  "auditor_ids": [3, 5, 6],
  "location": 2,
  "category": "laptop"
}
```

#### Start Audit
```
POST /api/audit-sessions/{id}/start/
```

**Response:** Updated session with `status: "in_progress"` and `started_at` timestamp

#### Complete Audit
```
POST /api/audit-sessions/{id}/complete/
```

**Behavior:**
- Updates session status to "completed"
- Sets completed_at timestamp
- Calculates variance report
- Summarizes findings

**Response:** Updated session with variance report data

#### Get Variance Report
```
GET /api/audit-sessions/{id}/variance_report/
```

**Response:**
```json
{
  "id": 1,
  "audit_session": 1,
  "total_expected": 45,
  "total_found": 44,
  "total_missing": 1,
  "damaged_count": 1,
  "condition_issues_count": 1,
  "location_mismatches_count": 1,
  "ownership_mismatches_count": 0,
  "accuracy_percentage": "97.78",
  "generated_by": 3,
  "generated_by_email": "manager@example.com",
  "generated_at": "2026-06-20T17:30:00Z",
  "notes": "One laptop found in wrong location, one damaged"
}
```

#### Record Audit Finding
```
POST /api/audit-findings/
```

**Required Fields:**
- `audit_session` - Audit session ID
- `asset` - Asset ID being audited
- `status` - found, not_found, damaged, condition_issue, location_mismatch, ownership_mismatch, other

**Optional Fields:**
- `notes` - Detailed notes
- `current_condition` - excellent, good, fair, poor, damaged
- `current_location` - Location ID where found
- `evidence_notes` - Photo descriptions or evidence

**Request:**
```json
{
  "audit_session": 1,
  "asset": 12,
  "status": "found",
  "notes": "Asset located in IT office",
  "current_condition": "good",
  "current_location": 2
}
```

**Response:**
```json
{
  "id": 1,
  "audit_session": 1,
  "asset": 12,
  "asset_tag": "LAP-0012",
  "asset_name": "Dell Laptop",
  "status": "found",
  "notes": "Asset located in IT office",
  "auditor": 3,
  "auditor_email": "auditor@example.com",
  "verified_at": "2026-06-20T10:30:00Z",
  "current_condition": "good",
  "current_location": 2,
  "evidence_notes": null
}
```

#### List Audit Findings
```
GET /api/audit-findings/
```

**Query Parameters:**
- `audit_session` - Filter by audit session ID
- `asset` - Filter by asset ID
- `status` - Filter by finding status
- `auditor` - Filter by auditor user ID

#### Update Finding
```
PUT /api/audit-findings/{id}/
PATCH /api/audit-findings/{id}/
```

**Updateable Fields:**
- `status`
- `notes`
- `current_condition`
- `current_location`
- `evidence_notes`

---

## Asset Depreciation API

### Overview
All assets now include depreciation calculations.

### Asset Detail Response (Updated)
```
GET /api/assets/{id}/
```

**New Field:** `depreciation`

```json
{
  "id": 1,
  "tag": "LAP-0001",
  "name": "Dell XPS Laptop",
  "purchase_date": "2022-01-15",
  "purchase_cost": "1200.00",
  "useful_life_years": 5,
  "residual_value": "200.00",
  "depreciation_method": "straight_line",
  "depreciation": {
    "purchase_cost": 1200.0,
    "depreciated_value": 600.0,
    "current_value": 600.0,
    "residual_value": 200.0,
    "months_in_use": 42,
    "months_useful_life": 60,
    "remaining_months": 18,
    "depreciation_percentage": 50.0,
    "is_fully_depreciated": false
  }
}
```

### Depreciation Calculation Methods

**1. Straight Line (Default)**
- Equal depreciation each period
- Formula: (Purchase Price - Residual Value) / Useful Life
- Best for: Most IT assets

**2. Declining Balance**
- Accelerated depreciation (2x rate)
- Higher depreciation early, lower later
- Best for: High-tech equipment with rapid obsolescence

**3. Units of Production**
- Depreciation based on usage
- Manual entry required
- Best for: Equipment with variable usage

---

## Role-Based Access Control

### New Roles Available

```
super_admin      - Full system access
it_admin        - IT operations (assets, assignments, licenses)
asset_manager   - Asset lifecycle (create/modify/retire)
department_manager - Department-level asset management
auditor         - Audit creation and verification
employee        - View own assignments only
```

### Permission Examples

**Create Attachment:**
- Requires: `IsAssetManager` permission
- Roles: asset_manager, it_admin, super_admin

**Start Audit:**
- Requires: `IsAuditor` permission
- Roles: auditor, asset_manager, it_admin, super_admin

**View Assets:**
- Requires: `IsAuthenticated` permission
- All roles can view (with data filtering)

**Delete Asset:**
- Requires: `IsAssetManager` permission
- Roles: asset_manager, it_admin, super_admin

---

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"],
  "non_field_errors": ["Validation error message"]
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 409 Conflict
```json
{
  "detail": "Asset already found in this audit session"
}
```

---

## Rate Limiting (Recommended for Production)

```
/api/attachments/download/ - 100 requests/hour per user
/api/audit-sessions/       - 1000 requests/hour per user
/api/assets/               - 5000 requests/hour per user
```

---

## Examples

### Upload Invoice and Create Finding

```bash
#!/bin/bash

API="http://api.example.com/api"
TOKEN="your_bearer_token"

# 1. Upload invoice
ATTACHMENT=$(curl -s -X POST "$API/attachments/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "asset=5" \
  -F "file=@invoice.pdf" \
  -F "title=Invoice" \
  -F "file_type=invoice")

echo "Uploaded attachment: $ATTACHMENT"

# 2. Create audit finding
curl -s -X POST "$API/audit-findings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audit_session": 1,
    "asset": 5,
    "status": "found",
    "notes": "Laptop located in office"
  }'
```

### Complete Audit and Download Report

```bash
# 1. Mark audit complete
curl -X POST "http://api/audit-sessions/1/complete/" \
  -H "Authorization: Bearer $TOKEN"

# 2. Get variance report
curl "http://api/audit-sessions/1/variance_report/" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Download findings as JSON
curl "http://api/audit-findings/?audit_session=1" \
  -H "Authorization: Bearer $TOKEN" > findings.json
```

---

**API Documentation Complete**
