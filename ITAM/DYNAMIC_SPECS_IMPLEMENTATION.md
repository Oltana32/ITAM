# Dynamic Asset Specifications Implementation - Summary

## Overview
Enhanced the asset form with dynamic fields that appear based on the selected Asset Category. All fields are category-specific and optional.

## Backend Changes

### 1. Database Model Update
**File:** `django-backend/apps/assets/models.py`
- Added `specs` field: `JSONField(default=dict, blank=True)`
- Stores category-specific specifications as key-value pairs

### 2. Django Migration
**File:** `django-backend/apps/assets/migrations/0011_asset_specs.py`
- Migration applied successfully
- Command: `python manage.py migrate`

### 3. Serializer Update
**File:** `django-backend/apps/assets/serializers.py`
- Added `"specs"` to AssetSerializer.Meta.fields
- Allows specs to be sent/received in API responses

### 4. Specifications Constants
**File:** `django-backend/apps/assets/specs.py` (NEW)
Contains:
- CPU_OPTIONS, RAM_OPTIONS, STORAGE_OPTIONS, OS_OPTIONS
- PRINTER_TYPE_OPTIONS, CONNECTIVITY_OPTIONS
- SCREEN_SIZE_OPTIONS, RESOLUTION_OPTIONS
- PORT_COUNT_OPTIONS
- CATEGORY_SPECS dictionary defining all dynamic fields per category
- Helper functions: `get_specs_for_category()`, `get_spec_options()`

### 5. API Endpoints
**File:** `django-backend/apps/assets/views.py`
Added two new endpoints:
- `GET /api/assets/specs_config/` - Returns all category specs configurations
- `GET /api/assets/category_specs/?category=laptop` - Returns specs for specific category

## Frontend Changes

### 1. Type Definitions
**File:** `frontend/src/types/asset.ts`
- Updated Asset interface with `specs?: Record<string, string | number>`

### 2. Specifications Constants
**File:** `frontend/src/data/assetSpecs.ts` (NEW)
Contains:
- All option arrays (CPU, RAM, Storage, OS, etc.)
- CATEGORY_SPECS configuration object
- SpecField and CategorySpecs interfaces
- Helper functions: `getSpecsForCategory()`, `hasSpecs()`

### 3. Form Component Update
**File:** `frontend/src/components/assets/AssetFormDialog.tsx`
Updated to:
- Import CATEGORY_SPECS from assetSpecs.ts
- Watch category field with `form.watch('category')`
- Display dynamic fields based on selected category
- Auto-reset specs when category changes
- Include condition field (was previously missing)
- Properly handle specs in form submission

## Specifications by Category

### Laptop, Desktop, Server
**Fields:**
- **CPU** (dropdown): Intel Core i3-i9, Intel Xeon, AMD Ryzen 3-9, AMD EPYC
- **RAM** (dropdown): 4GB to 128GB
- **Storage** (dropdown): SSD (128GB to 2TB) or HDD (500GB to 4TB)
- **Operating System** (dropdown): Windows 10/11 Pro, Server 2019/2022, Ubuntu/Red Hat

### Printer (Equipment Category)
**Fields:**
- **Printer Type** (dropdown): Laser, Inkjet, Thermal, Dot Matrix, ID Card, Multifunction
- **Connectivity** (dropdown): USB, Ethernet, Wi-Fi, Bluetooth, USB + Ethernet, Wi-Fi + Ethernet

### Monitor
**Fields:**
- **Screen Size** (dropdown): 19", 22", 24", 27", 32"
- **Resolution** (dropdown): HD, Full HD, QHD, 4K

### Network (Router, Switch, Firewall, Access Point)
**Fields:**
- **Port Count** (text): e.g., "24"
- **IP Address** (text): e.g., "192.168.1.1"
- **MAC Address** (text): e.g., "00:1A:2B:3C:4D:5E"

### Other Categories (Phone, Tablet, Equipment, Other)
- No dynamic specifications (default behavior)

## Data Flow

### Creating an Asset with Specs
1. User selects category from dropdown
2. Form dynamically renders category-specific fields
3. User fills in specs fields (optional)
4. Form submission sends:
   ```json
   {
     "name": "...",
     "category": "laptop",
     "specs": {
       "cpu": "Intel Core i7",
       "ram": "16GB",
       "storage": "512GB SSD",
       "os": "Windows 11 Pro"
     },
     ...other fields...
   }
   ```
5. Backend saves specs as JSON in Asset.specs field

### Editing an Asset
1. Previous specs load automatically for the selected category
2. User can modify specs values
3. Specs reset when category changes
4. Changes saved to database

## Files Modified/Created

### Backend
- ✅ `django-backend/apps/assets/models.py` - Added specs JSONField
- ✅ `django-backend/apps/assets/serializers.py` - Added specs to fields
- ✅ `django-backend/apps/assets/views.py` - Added API endpoints
- ✅ `django-backend/apps/assets/specs.py` - NEW: Specifications constants
- ✅ `django-backend/apps/assets/migrations/0011_asset_specs.py` - NEW: Migration

### Frontend
- ✅ `frontend/src/types/asset.ts` - Added specs to Asset interface
- ✅ `frontend/src/data/assetSpecs.ts` - NEW: Specifications configuration
- ✅ `frontend/src/components/assets/AssetFormDialog.tsx` - Updated form component

## Testing Checklist

- [ ] Create laptop asset with CPU/RAM/Storage/OS specs
- [ ] Create desktop asset with specs
- [ ] Create server asset with specs
- [ ] Create monitor asset with screen size/resolution
- [ ] Create printer (equipment) with type/connectivity
- [ ] Create network device with port count/IP/MAC
- [ ] Create asset with no category-specific specs (phone, tablet, other)
- [ ] Edit existing asset and modify specs
- [ ] Change category and verify specs reset
- [ ] Verify API endpoint returns correct specs config
- [ ] Verify specs saved correctly in database

## Notes

- All specs fields are optional (not required)
- Specs are category-specific and not applicable to all asset types
- Specs data is stored as JSON for flexibility
- Frontend constants match backend CATEGORY_SPECS configuration
- Form validates and submits specs with asset data
- Existing assets without specs will have empty {} or null specs