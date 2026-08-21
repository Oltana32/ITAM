export interface IssueVoucherEmployee {
  name: string;
  employeeId: string;
  department: string;
  position: string;
  location: string;
}

export interface ReturnVoucherInspection {
  inspectionDate: string;
  inspectedBy: string;
  overallCondition: string;
  physicalCondition: string;
  functionalTest: string;
  accessoriesReturned: string;
  missingAccessories: string;
  requiresMaintenance: boolean;
  maintenanceIssue: string;
  dataWiped: string;
  finalAssetStatus: string;
  inspectionRemarks: string;
  employeeSignature: string;
  itStaffSignature: string;
  returnedBy: string;
  receivedBy: string;
}

export interface IssueVoucherAsset {
  assetTag: string;
  assetName: string;
  brand: string;
  model: string;
  serialNumber: string;
  condition: string;
  status: string;
  qrValue: string;
  assetCategory?: string;
  specs?: Record<string, string | number>;
}

export interface IssueVoucherData {
  voucherNumber: string;
  issueDate: string;
  printedBy: string;
  employee: IssueVoucherEmployee;
  assets: IssueVoucherAsset[];
  inspection?: ReturnVoucherInspection;
}

interface AssignmentLike {
  asset?: number | string;
  asset_tag?: string;
  asset_name?: string;
  assignedTo?: string;
  employeeId?: string;
  employeeDepartment?: string;
  employeePosition?: string;
  location?: string;
  status?: string;
  assigned_date?: string;
  asset_manufacturer?: string;
  manufacturer?: string;
  asset_model?: string;
  model?: string;
  asset_serial_number?: string;
  serialNumber?: string;
  asset_condition?: string;
  condition?: string;
}

interface AssetLike {
  id?: string | number;
  name?: string;
  assetTag?: string;
  tag?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;
  category?: string;
  specs?: Record<string, string | number>;
}

interface BuildIssueVoucherDataFromAssignmentsInput {
  employeeName: string;
  employeeId: string;
  department: string;
  position: string;
  location: string;
  printedBy: string;
  assignments: AssignmentLike[];
  assets: AssetLike[];
}

interface VoucherPage {
  html: string;
  assetRows: IssueVoucherAsset[];
}

const AGREEMENT_TEXT = 'By signing this form, I acknowledge that I have received the equipment listed above in good working condition. I understand that all assigned equipment remains the property of Awash Wine S.C. and is provided solely for authorized business purposes. I agree to exercise reasonable care in the use and safekeeping of the assigned equipment and to promptly report any loss, theft, damage, or malfunction to the IT Department. I further agree to return all assigned equipment in good condition upon transfer, resignation, termination of employment, or whenever requested by the Company. I also agree to comply with all applicable Company ICT policies and procedures. I understand that I may be held responsible for any loss, damage, misuse, or unauthorized use of the assigned equipment resulting from negligence or failure to comply with Company policies.';
// Use the provided Equipment Return Agreement for return declarations
const RETURN_AGREEMENT_TEXT = `By signing this form, I acknowledge that the equipment listed above has been returned to the IT Department of Awash Wine S.C. I understand that the returned equipment has been received for inspection and verification of its condition, functionality, and completeness.

I acknowledge that any missing items, damage beyond normal wear and tear, misuse, or unauthorized modifications identified during the inspection will be documented, and I may be held responsible in accordance with Company ICT and Fnance policies and procedures.`;

const MAX_ROWS_PER_PAGE = 6;

interface VoucherTemplateConfig {
  title: string;
  subtitle: string;
  metaDateLabel: string;
  metaByLabel: string;
  equipmentHeading: string;
  statusColumnLabel: string;
  agreementTitle: string;
  agreementText: string;
  signatureLabels: {
    approved: string;
    received: string;
  };
}

const ISSUE_VOUCHER_CONFIG: VoucherTemplateConfig = {
  title: 'IT Equipment Assignment Agreement',
  subtitle: '',
  metaDateLabel: 'Issue Date',
  metaByLabel: 'Printed By',
  equipmentHeading: 'Assigned Equipment',
  statusColumnLabel: 'Status',
  agreementTitle: 'Employee Equipment Agreement',
  agreementText: AGREEMENT_TEXT,
  signatureLabels: {
    approved: 'Approved By (IT Manager):',
    received: 'Received By (Employee):',
  },
};

const RETURN_VOUCHER_CONFIG: VoucherTemplateConfig = {
  title: 'IT EQUIPMENT RETURN Form',
  subtitle: '',
  metaDateLabel: 'Return Date',
  metaByLabel: 'Processed By',
  equipmentHeading: 'Returned Equipment',
  statusColumnLabel: 'Return Status',
  agreementTitle: 'Equipment Return Agreement',
  agreementText: RETURN_AGREEMENT_TEXT,
  signatureLabels: {
    approved: 'APPROVED BY (IT MANAGER)',
    received: 'RETURNED BY (EMPLOYEE)',
  },
};

function escapeHtml(value?: string): string {
  const input = value ?? '—';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatField(value?: string): string {
  return escapeHtml(value?.trim() ? value.trim() : '—');
}

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatInspectionValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function buildInspectionDetailsSection(inspection: ReturnVoucherInspection): string {
  const items = [
    ['Inspection Date', inspection.inspectionDate],
    ['Inspected By', inspection.inspectedBy],
    ['Overall Condition', inspection.overallCondition],
    ['Physical Condition', inspection.physicalCondition],
    ['Functional Test', inspection.functionalTest],
    ['Accessories Returned', inspection.accessoriesReturned],
    ['Missing Accessories', inspection.missingAccessories],
    ['Requires Maintenance', inspection.requiresMaintenance],
    ['Maintenance Issue', inspection.maintenanceIssue],
    ['Data Wiped', inspection.dataWiped],
    ['Final Asset Status', inspection.finalAssetStatus],
    ['Inspection Remarks', inspection.inspectionRemarks],
    ['Returned By', inspection.returnedBy],
    ['Received By', inspection.receivedBy],
  ];

  const rows = items.map(([label, value]) => `
    <div class="inspection-item">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-value">${formatInspectionValue(value)}</div>
    </div>`).join('');

  return `
    <div class="section">
      <div class="section-title">Inspection Details</div>
      <div class="inspection-grid">${rows}</div>
    </div>`;
}

function buildAssetRows(assets: IssueVoucherAsset[]): string {
  return assets.map((asset, index) => `
    <tr>
      <td class="cell">${index + 1}</td>
      <td class="cell">${formatField(asset.assetTag)}</td>
      <td class="cell">${formatField(asset.assetCategory || 'Other')}</td>
      <td class="cell">${formatField(asset.brand)}</td>
      <td class="cell">${formatField(asset.model)}</td>
      <td class="cell">${formatField(asset.serialNumber)}</td>
      <td class="cell">${formatField(asset.condition)}</td>
      <td class="cell">${formatField(asset.status)}</td>
    </tr>`).join('');
}

function buildQrBlocks(assets: IssueVoucherAsset[]): string {
  const blocks = assets.map((asset) => `
    <div class="qr-card">
      <div class="qr-box">
        <img
          class="qr-img voucher-asset"
          src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(asset.qrValue)}"
          alt="QR code for ${escapeHtml(asset.assetTag)}"
          data-qr-value="${escapeHtml(asset.qrValue)}"
          loading="eager"
          onerror="this.outerHTML='<div class=&quot;qr-fallback&quot;>QR data: '+this.dataset.qrValue+'</div>'"
        />
      </div>
      <div class="qr-tag">${escapeHtml(asset.assetTag)}</div>
    </div>`).join('');

  return `<div class="qr-grid">${blocks}</div>`;
}

function buildVoucherPages(data: IssueVoucherData, logoUrl: string, config: VoucherTemplateConfig): VoucherPage[] {
  const pages: VoucherPage[] = [];
  const assetChunks = [] as IssueVoucherAsset[][];

  for (let index = 0; index < data.assets.length; index += MAX_ROWS_PER_PAGE) {
    assetChunks.push(data.assets.slice(index, index + MAX_ROWS_PER_PAGE));
  }

  assetChunks.forEach((assets, pageIndex) => {
    const pageNumber = pageIndex + 1;
    const totalPages = assetChunks.length;
    pages.push({
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(config.title)}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      html, body { width: 210mm; min-height: 297mm; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
      .page { width: calc(210mm - 16mm); min-height: calc(297mm - 16mm); box-sizing: border-box; padding: 5mm; margin: 0 auto; page-break-after: always; display: flex; flex-direction: column; }
      .page:last-child { page-break-after: auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px; gap: 16px; }
      .brand { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; flex: 1 1 auto; }
      .logo-box { width: 48px; height: 48px; border: 1px solid #9f1239; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9f1239; font-weight: 700; font-size: 16px; }
      .company-title { font-size: 17px; font-weight: 700; color: #111827; margin: 0; }
      .company-subtitle { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.2; }
      .company-caption { font-size: 10px; color: #6b7280; margin-top: 2px; line-height: 1.2; }
      .voucher-meta { text-align: right; font-size: 10px; color: #374151; min-width: 160px; }
      .voucher-meta strong { display: block; color: #111827; font-size: 11px; margin-top: 4px; }
      .section { border: 1px solid #d1d5db; border-radius: 8px; padding: 7px 9px; margin-bottom: 10px; page-break-inside: avoid; }
      .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9f1239; margin-bottom: 9px; }
      .employee-grid { display: grid; grid-template-columns: 1.2fr 0.6fr; gap: 14px; align-items: start; }
      .employee-card { display: flex; flex-direction: column; gap: 6px; }
      .two-col { display: grid; grid-template-columns: 1fr; gap: 9px; }
      .field { margin-bottom: 6px; }
      .field-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
      .field-value { font-size: 11px; font-weight: 600; color: #111827; }
      table { width: 100%; border-collapse: collapse; font-size: 9.5px; table-layout: fixed; }
      th, td { border: 1px solid #cbd5e1; padding: 4px 5px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; font-weight: 700; }
      .cell { font-size: 9px; }
      .qr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 14px; margin-top: 10px; }
      .qr-card { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; text-align: center; min-height: 122px; background: #fafafa; box-shadow: inset 0 0 0 1px #f3f4f6; }
      .qr-box { display: flex; justify-content: center; align-items: center; margin-bottom: 6px; padding: 2px; }
      .qr-tag { font-size: 9px; font-weight: 700; color: #111827; word-break: break-all; padding-top: 2px; }
      .agreement { font-size: 10px; color: #374151; line-height: 1.35; text-align: justify; margin: 4px 0 0; }
      .content-sections { margin-top: auto; margin-bottom: auto; display: flex; flex-direction: column; gap: 10px; }
      .inspection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; }
      .inspection-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 7px; background: #f9fafb; }
      .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: auto; page-break-inside: avoid; }

      .sig-box { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; min-height: 76px; }
      .sig-row { display: flex; align-items: center; gap: 10px; margin: 12px 0 4px; }
      .sig-line { flex: 1; max-width: 140px; border-bottom: 1px solid #111827; }
      .footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 8px; }
      .footer-row { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 8px; }
      .page-number { text-align: right; }
      .logo-img { width: 46px; height: 46px; object-fit: contain; display: block; }
      .qr-img { width: 70px; height: 70px; object-fit: contain; image-rendering: crisp-edges; margin: 0 auto; display: block; }
      .qr-card { min-height: 104px; }
      .qr-fallback { font-size: 10px; color: #374151; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; text-align: center; word-break: break-word; }
      .logo-text { font-size: 11px; font-weight: 700; color: #9f1239; text-align: center; line-height: 1.2; min-height: 44px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="brand">
          <div class="logo-box">
            <img
              class="logo-img voucher-asset"
              src="${escapeHtml(logoUrl)}"
              alt="Awash Wine logo"
              loading="eager"
              onerror="this.outerHTML='<div class=\'logo-text\'>AWASH WINE S.C.<\/div>'"
            />
          </div>
          <div>
            <p class="company-title">AWASH WINE S.C.</p>
            <p class="company-subtitle">${config.title}</p>
            <p class="company-caption">${config.subtitle}</p>
          </div>
        </div>
      </div>

      <div class="content-sections">
      <div class="section">
        <div class="section-title">Employee Information & QR Codes</div>
        <div class="employee-grid">
          <div class="employee-card">
            <div class="two-col">
              <div class="field"><div class="field-label">Employee Name</div><div class="field-value">${formatField(data.employee.name)}</div></div>
              <div class="field"><div class="field-label">Employee ID</div><div class="field-value">${formatField(data.employee.employeeId)}</div></div>
              <div class="field"><div class="field-label">Department</div><div class="field-value">${formatField(data.employee.department)}</div></div>
              <div class="field"><div class="field-label">Position</div><div class="field-value">${formatField(data.employee.position)}</div></div>
              <div class="field"><div class="field-label">Location</div><div class="field-value">${formatField(data.employee.location)}</div></div>
            </div>
          </div>
          <div class="employee-card">
            ${buildQrBlocks(assets)}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${config.equipmentHeading}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Asset Tag</th>
              <th>Asset Category</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Condition</th>
              <th>${escapeHtml(config.statusColumnLabel)}</th>
            </tr>
          </thead>
          <tbody>
            ${buildAssetRows(assets)}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">${config.agreementTitle}</div>
        <div class="agreement">${config.agreementText}</div>
      </div>
      </div>

      ${data.inspection && config.title === RETURN_VOUCHER_CONFIG.title ? buildInspectionDetailsSection(data.inspection) : ''}

      <div class="signatures">
        <div class="sig-box">
          <div class="field-label">${escapeHtml(config.signatureLabels.approved)}</div>
          <div class="field"><div class="field-label">Name</div><div class="field-value"></div></div>
          <div class="sig-row"><div class="field-label">Signature</div><div class="sig-line"></div></div>
          <div class="field"><div class="field-label">Date</div><div class="field-value"></div></div>
        </div>
        <div class="sig-box">
          <div class="field-label">${escapeHtml(config.signatureLabels.received)}</div>
          <div class="field"><div class="field-label">Name</div><div class="field-value">${escapeHtml(data.employee.name)}</div></div>
          <div class="sig-row"><div class="field-label">Signature</div><div class="sig-line"></div></div>
          <div class="field"><div class="field-label">Date</div><div class="field-value"></div></div>
        </div>
      </div>

      <div class="footer-row">
        <div class="footer">Printed By: ${escapeHtml(data.printedBy)} | Print Date: ${escapeHtml(new Date().toLocaleString())}</div>
        <div class="footer page-number">Page ${pageNumber} of ${totalPages}</div>
      </div>
    </div>
    <script>
      window.voucherLoadedCount = window.voucherLoadedCount || 0;
      function voucherAssetLoaded() {
        window.voucherLoadedCount = (window.voucherLoadedCount || 0) + 1;
      }
      function voucherLogoError(img) {
        var parent = img.parentElement;
        if (parent) {
          parent.innerHTML = '<div class="logo-text">AWASH WINE S.C.</div>';
        }
        voucherAssetLoaded();
      }
      function voucherQrError(img) {
        var fallback = document.createElement('div');
        fallback.className = 'qr-fallback';
        fallback.textContent = 'QR data: ' + (img.dataset?.qrValue || 'Unavailable');
        img.replaceWith(fallback);
        voucherAssetLoaded();
      }
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 250);
      });
    </script>
</html>`,
      assetRows: assets,
    });
  });

  return pages;
}

export function buildIssueVoucherDataFromAssignments(input: BuildIssueVoucherDataFromAssignmentsInput): IssueVoucherData {
  const normalizedAssets = input.assignments
    .filter((assignment) => assignment.status === undefined || assignment.status === 'assigned' || assignment.status === 'in_use' || assignment.status === 'active' || assignment.status === 'in-use')
    .map((assignment) => {
      const asset = input.assets.find((item) => String(item.id) === String(assignment.asset));
      const assetTag = assignment.asset_tag || asset?.assetTag || asset?.tag || '—';
      const assetName = assignment.asset_name || asset?.name || '—';
      const brand = assignment.asset_manufacturer || assignment.manufacturer || asset?.manufacturer || '—';
      const model = assignment.asset_model || assignment.model || asset?.model || '—';
      const serialNumber = assignment.asset_serial_number || assignment.serialNumber || asset?.serialNumber || '—';
      const conditionValue = assignment.asset_condition || assignment.condition || asset?.condition;
      const condition = conditionValue
        ? String(conditionValue).charAt(0).toUpperCase() + String(conditionValue).slice(1)
        : 'Good';

      return {
        assetTag,
        assetName,
        brand,
        model,
        serialNumber,
        condition,
        status: 'Assigned',
        qrValue: `https://itam.company.local/assets/${assetTag === '—' ? 'unknown' : assetTag}`,
        assetCategory: asset?.category,
        specs: asset?.specs,
      } satisfies IssueVoucherAsset;
    });

  return {
    voucherNumber: `AW-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
    issueDate: new Date().toISOString(),
    printedBy: input.printedBy,
    employee: {
      name: input.employeeName,
      employeeId: input.employeeId,
      department: input.department,
      position: input.position,
      location: input.location,
    },
    assets: normalizedAssets,
  };
}

export function buildIssueVoucherPages(data: IssueVoucherData, logoUrl: string = '/awash%20wine%20logo.png'): VoucherPage[] {
  return buildVoucherPages(data, logoUrl, ISSUE_VOUCHER_CONFIG);
}

export function buildReturnVoucherPages(data: IssueVoucherData, logoUrl: string = '/awash%20wine%20logo.png'): VoucherPage[] {
  return buildVoucherPages(data, logoUrl, RETURN_VOUCHER_CONFIG);
}
