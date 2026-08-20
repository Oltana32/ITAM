// frontend/src/data/assetSpecs.ts
import { AssetCategory } from '@/types/asset';

export const CPU_OPTIONS = [
  'Intel Core i3',
  'Intel Core i5',
  'Intel Core i7',
  'Intel Core i9',
  'Intel Xeon',
  'AMD Ryzen 3',
  'AMD Ryzen 5',
  'AMD Ryzen 7',
  'AMD Ryzen 9',
  'AMD EPYC',
];

export const RAM_OPTIONS = ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'];

export const STORAGE_OPTIONS = [
  '128GB SSD',
  '256GB SSD',
  '512GB SSD',
  '1TB SSD',
  '2TB SSD',
  '500GB HDD',
  '1TB HDD',
  '2TB HDD',
  '4TB HDD',
];

export const OS_OPTIONS = [
  'Windows 10 Pro',
  'Windows 11 Pro',
  'Windows Server 2019',
  'Windows Server 2022',
  'Ubuntu Linux',
  'Red Hat Enterprise Linux',
];

export const PRINTER_TYPE_OPTIONS = [
  'Laser',
  'Inkjet',
  'Thermal',
  'Dot Matrix',
  'ID Card Printer',
  'Multifunction Printer',
];

export const CONNECTIVITY_OPTIONS = [
  'USB',
  'Ethernet',
  'Wi-Fi',
  'Bluetooth',
  'USB + Ethernet',
  'Wi-Fi + Ethernet',
];

export const SCREEN_SIZE_OPTIONS = ['19"', '22"', '24"', '27"', '32"'];

export const RESOLUTION_OPTIONS = ['HD', 'Full HD', 'QHD', '4K'];

export const PORT_COUNT_OPTIONS = ['4', '8', '16', '24', '32', '48', '64'];

export interface SpecField {
  label: string;
  type: 'select' | 'text' | 'number';
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface CategorySpecs {
  label: string;
  fields: Record<string, SpecField>;
}

export const CATEGORY_SPECS: Record<string, CategorySpecs> = {
  laptop: {
    label: 'Laptop Specifications',
    fields: {
      cpu: {
        label: 'CPU',
        type: 'select',
        options: CPU_OPTIONS,
        required: false,
      },
      ram: {
        label: 'RAM',
        type: 'select',
        options: RAM_OPTIONS,
        required: false,
      },
      storage: {
        label: 'Storage',
        type: 'select',
        options: STORAGE_OPTIONS,
        required: false,
      },
      os: {
        label: 'Operating System',
        type: 'select',
        options: OS_OPTIONS,
        required: false,
      },
    },
  },
  desktop: {
    label: 'Desktop Specifications',
    fields: {
      cpu: {
        label: 'CPU',
        type: 'select',
        options: CPU_OPTIONS,
        required: false,
      },
      ram: {
        label: 'RAM',
        type: 'select',
        options: RAM_OPTIONS,
        required: false,
      },
      storage: {
        label: 'Storage',
        type: 'select',
        options: STORAGE_OPTIONS,
        required: false,
      },
      os: {
        label: 'Operating System',
        type: 'select',
        options: OS_OPTIONS,
        required: false,
      },
    },
  },
  server: {
    label: 'Server Specifications',
    fields: {
      cpu: {
        label: 'CPU',
        type: 'select',
        options: CPU_OPTIONS,
        required: false,
      },
      ram: {
        label: 'RAM',
        type: 'select',
        options: RAM_OPTIONS,
        required: false,
      },
      storage: {
        label: 'Storage',
        type: 'select',
        options: STORAGE_OPTIONS,
        required: false,
      },
      os: {
        label: 'Operating System',
        type: 'select',
        options: OS_OPTIONS,
        required: false,
      },
    },
  },
  printer: {
    label: 'Printer Specifications',
    fields: {
      printer_type: {
        label: 'Printer Type',
        type: 'select',
        options: PRINTER_TYPE_OPTIONS,
        required: false,
      },
      connectivity: {
        label: 'Connectivity',
        type: 'select',
        options: CONNECTIVITY_OPTIONS,
        required: false,
      },
    },
  },
  equipment: {
    label: 'Equipment / Printer Specifications',
    fields: {
      printer_type: {
        label: 'Printer Type',
        type: 'select',
        options: PRINTER_TYPE_OPTIONS,
        required: false,
      },
      connectivity: {
        label: 'Connectivity',
        type: 'select',
        options: CONNECTIVITY_OPTIONS,
        required: false,
      },
    },
  },
  monitor: {
    label: 'Monitor Specifications',
    fields: {
      screen_size: {
        label: 'Screen Size',
        type: 'select',
        options: SCREEN_SIZE_OPTIONS,
        required: false,
      },
      resolution: {
        label: 'Resolution',
        type: 'select',
        options: RESOLUTION_OPTIONS,
        required: false,
      },
    },
  },
  phone: {
    label: 'Phone Specifications',
    fields: {
      storage: {
        label: 'Storage',
        type: 'select',
        options: STORAGE_OPTIONS,
        required: false,
      },
      os: {
        label: 'Operating System',
        type: 'select',
        options: OS_OPTIONS,
        required: false,
      },
      screen_size: {
        label: 'Screen Size',
        type: 'select',
        options: SCREEN_SIZE_OPTIONS,
        required: false,
      },
    },
  },
  tablet: {
    label: 'Tablet Specifications',
    fields: {
      storage: {
        label: 'Storage',
        type: 'select',
        options: STORAGE_OPTIONS,
        required: false,
      },
      os: {
        label: 'Operating System',
        type: 'select',
        options: OS_OPTIONS,
        required: false,
      },
      screen_size: {
        label: 'Screen Size',
        type: 'select',
        options: SCREEN_SIZE_OPTIONS,
        required: false,
      },
    },
  },
  network: {
    label: 'Network Device Specifications',
    fields: {
      port_count: {
        label: 'Port Count',
        type: 'text',
        required: false,
        placeholder: 'e.g., 24',
      },
      ip_address: {
        label: 'IP Address',
        type: 'text',
        required: false,
        placeholder: 'e.g., 192.168.1.1',
      },
      mac_address: {
        label: 'MAC Address',
        type: 'text',
        required: false,
        placeholder: 'e.g., 00:1A:2B:3C:4D:5E',
      },
    },
  },
};

export function getSpecsForCategory(category: string): CategorySpecs | undefined {
  return CATEGORY_SPECS[category];
}

export function hasSpecs(category: AssetCategory): boolean {
  return category === 'laptop' ||
         category === 'desktop' ||
         category === 'server' ||
         category === 'monitor' ||
         category === 'network' ||
         category === 'equipment' ||
         category === 'phone' ||
         category === 'tablet';
}
