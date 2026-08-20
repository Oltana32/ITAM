export type AssetStatus = 'available' | 'assigned' | 'retired' | 'disposed' | 'lost' | 'damaged' | 'in-use' | 'ready' | 'maintenance';
export type AssetCategory = 'laptop' | 'desktop' | 'monitor' | 'server' | 'phone' | 'tablet' | 'network' | 'equipment' | 'other';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';
export type AssignmentStatus =
  | 'assigned'
  | 'in_use'
  | 'in-use'
  | 'returned'
  | 'overdue'
  | 'available'
  | 'maintenance'
  | 'retired'
  | 'disposed'
  | 'lost'
  | 'damaged'
  | 'active';

/** Backend uses unified asset statuses; treat assigned/in_use as active assignments. */
export function isActiveAssignmentStatus(status: string): boolean {
  const normalized = status.replace('-', '_');
  return normalized === 'assigned' || normalized === 'in_use' || normalized === 'active';
}

export interface Asset {
  id: string;
  name: string;
  tag: string;
  assetTag?: string; // Legacy support
  category: AssetCategory;
  status: AssetStatus;
  condition?: AssetCondition;
  assignedTo?: string;
  employeeId?: string;
  department?: string;
  location: string;
  purchaseDate: string;
  purchaseCost?: number;
  currentValue?: number;
  warrantyExpiry?: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  specs?: Record<string, string | number>; // Dynamic specifications based on category
  notes?: string;
  lastAuditDate?: string;
  allocatedAt?: string;
  manufacturer_name?: string;
  manufacturer_id?: number;
}

export interface Location {
  id: string | number;
  name: string;
  city?: string;
  city_display?: string;
  building?: string;
  floor?: string;
}

export interface SoftwareLicense {
  id: string | number;
  software_name: string;
  vendor: string;
  vendor_display?: string;
  seats: number;
  expiry_date?: string;
  assigned_to?: string;
  notes?: string;
}

export interface Manufacturer {
  id: string | number;
  name: string;
}

export const categoryLabels: Record<AssetCategory, string> = {
  laptop: 'Laptop',
  desktop: 'Desktop',
  monitor: 'Monitor',
  server: 'Server',
  phone: 'Phone',
  tablet: 'Tablet',
  network: 'Network Equipment',
  equipment: 'Equipment / Printer',
  other: 'Other',
};

export const statusLabels: Record<AssetStatus, string> = {
  'available': 'Available',
  'assigned': 'Assigned',
  'in-use': 'In Use',
  'ready': 'Ready',
  'maintenance': 'Under Maintenance',
  'retired': 'Retired',
  'disposed': 'Disposed',
  'lost': 'Lost',
  'damaged': 'Damaged',
};

export const assignmentStatusLabels: Record<string, string> = {
  assigned: 'Assigned',
  in_use: 'In Use',
  'in-use': 'In Use',
  active: 'Active',
  returned: 'Returned',
  overdue: 'Overdue',
  available: 'Available',
  maintenance: 'Under Maintenance',
  retired: 'Retired',
  disposed: 'Disposed',
  lost: 'Lost',
  damaged: 'Damaged',
};

export const ethiopianCities: Record<string, string> = {
  'addis_ababa': 'Addis Ababa',
  'adama': 'Adama',
  'dire_dawa': 'Dire Dawa',
  'hawassa': 'Hawassa',
  'bahir_dar': 'Bahir Dar',
  'mekelle': 'Mekelle',
  'jimma': 'Jimma',
  'dessie': 'Dessie',
  'gondar': 'Gondar',
  'bishoftu': 'Bishoftu',
  'harar': 'Harar',
  'shashemene': 'Shashemene',
  'nekemte': 'Nekemte',
  'debre_birhan': 'Debre Birhan',
  'assosa': 'Assosa',
  'semera': 'Semera',
  'jigjiga': 'Jigjiga',
  'arba_minch': 'Arba Minch',
};

export const vendorOptions = [
  'Microsoft',
  'Adobe',
  'Oracle',
  'SAP',
  'Autodesk',
  'VMware',
  'Cisco',
  'IBM',
  'Google',
  'Atlassian',
  'Red Hat',
  'JetBrains',
  'Zoho',
  'Salesforce',
  'Other',
];

export const conditionLabels: Record<AssetCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};
